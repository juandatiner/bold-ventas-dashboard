import { paginaDashboard, iconoSvg } from './dashboard.js';

const ZONA_OFFSET_HORAS = -5; // America/Bogota, sin horario de verano

// Ventas que no pasaron por ningun datafono fisico: links de pago, transferencias, etc.
// Se agrupan todas bajo una sola clave para que aparezcan como una tarjeta mas
// en el dashboard (no como "sin asignar"), sin importar el metodo especifico.
const CLAVE_LINK = 'link-transferencia';
const NOMBRE_LINK = 'Link y transferencias';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruta = url.pathname;

    try {
      if (ruta === '/webhook/bold' && request.method === 'POST') {
        return await recibirWebhook(request, env);
      }
      if (ruta === '/api/import' && request.method === 'POST') {
        return await importarLote(request, env);
      }
      // Algunos navegadores lo piden directo, sin mirar el <link> del HTML.
      if (ruta === '/favicon.ico' || ruta === '/favicon.svg') {
        return new Response(iconoSvg, {
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
      if (ruta === '/salud') {
        return json({ ok: true, hora: new Date().toISOString() });
      }

      if (ruta === '/' || ruta === '/index.html') return html(paginaDashboard());
      if (ruta === '/api/resumen') return await apiResumen(request, env);
      if (ruta === '/api/transacciones') return await apiTransacciones(request, env);
      if (ruta === '/api/terminales' && request.method === 'GET') return await apiTerminales(env);
      if (ruta === '/api/terminales' && request.method === 'POST') return await apiGuardarTerminal(request, env);
      if (ruta === '/api/eventos') return await apiEventos(env);

      return json({ error: 'ruta no encontrada' }, 404);
    } catch (e) {
      return json({ error: 'error interno', detalle: String(e && e.message || e) }, 500);
    }
  },
};

/* ------------------------------------------------------------------ *
 * Webhook
 * ------------------------------------------------------------------ */

async function recibirWebhook(request, env) {
  const cuerpo = await request.text();
  const firma = request.headers.get('x-bold-signature');

  if (!(await firmaValida(cuerpo, firma, env.BOLD_SECRET_KEY))) {
    // Queda registrado: sin esto, un secreto mal cargado es invisible desde
    // afuera (Bold entrega, el Worker rechaza, y no hay rastro de nada).
    await logEvento(env, null, null, 0, 'firma invalida', cuerpo);
    // 401 y no reintentar: si la firma no cuadra, reintentar no arregla nada.
    return json({ error: 'firma invalida' }, 401);
  }

  // Responder rapido: Bold exige HTTP 200 en menos de 2 segundos.
  let evento;
  try {
    evento = JSON.parse(cuerpo);
  } catch {
    await logEvento(env, null, null, 0, 'json ilegible', cuerpo);
    return json({ ok: true });
  }

  try {
    await procesarEvento(env, evento, cuerpo);
    await logEvento(env, evento.id, evento.type, 1, null, cuerpo);
  } catch (e) {
    await logEvento(env, evento.id, evento.type, 0, String(e && e.message || e), cuerpo);
  }

  return json({ ok: true });
}

async function firmaValida(cuerpo, firmaRecibida, secreto) {
  if (!firmaRecibida || !secreto) return false;

  // Bold: HMAC-SHA256 sobre base64(cuerpo crudo), resultado en hex.
  const enBase64 = btoa(unescape(encodeURIComponent(cuerpo)));
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firmaBytes = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(enBase64));
  const esperada = [...new Uint8Array(firmaBytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return comparacionConstante(esperada, firmaRecibida.trim().toLowerCase());
}

function comparacionConstante(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

async function procesarEvento(env, evento, cuerpoCrudo) {
  const tipo = evento.type;
  const d = evento.data || {};

  if (tipo === 'VOID_APPROVED') {
    const objetivo = d.payment_id || evento.subject;
    if (!objetivo) return;
    const res = await env.DB.prepare(
      'UPDATE transacciones SET anulada = 1 WHERE payment_id = ?',
    ).bind(objetivo).run();
    // Si la anulacion llego antes que la venta, la dejamos pendiente.
    if (!res.meta.changes) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO anulaciones_pendientes (payment_id, recibida_en) VALUES (?, ?)',
      ).bind(objetivo, new Date().toISOString()).run();
    }
    return;
  }

  // Solo guardamos ventas aprobadas. Rechazos quedan en eventos_log.
  if (tipo !== 'SALE_APPROVED') return;

  await guardarVenta(env, normalizarVenta(evento), cuerpoCrudo);
}

function normalizarVenta(evento) {
  const d = evento.data || {};
  const monto = d.amount || {};
  const creado = d.created_at || new Date().toISOString();
  const vendedor = evento.seller
    ? [evento.seller.name, evento.seller.last_name].filter(Boolean).join(' ').trim() || null
    : null;

  return {
    payment_id: d.payment_id || evento.subject,
    event_type: evento.type,
    source: evento.source || null,
    payment_method: d.payment_method || null,
    clave_terminal: claveTerminal(evento),
    terminal_id: (d.card && d.card.terminal_id) || null,
    user_id: d.user_id || null,
    merchant_id: d.merchant_id || null,
    monto: Math.round(Number(monto.total) || 0),
    propina: Math.round(Number(monto.tip) || 0),
    moneda: monto.currency || 'COP',
    created_at: creado,
    fecha_venta: fechaBogota(creado),
    bold_code: d.bold_code || null,
    referencia: (d.metadata && d.metadata.reference) || null,
    vendedor,
    // Quien pago: en tarjeta viene el nombre del tarjetahabiente; en QR el
    // webhook de Bold no trae nombre del pagador (solo email, que no guardamos).
    pagador: (d.card && d.card.cardholder_name) || null,
    origen: 'webhook',
  };
}

/**
 * Discriminador del datafono/QR.
 *
 * Pagos CARD traen data.card.terminal_id — ese es el identificador directo.
 * Pagos QR NO traen terminal_id; el mejor candidato documentado es data.user_id,
 * que en la practica corresponde al usuario/dispositivo dueno del QR.
 *
 * Por eso guardamos SIEMPRE el payload crudo en la columna `raw`: si resulta que
 * el discriminador correcto es otro campo, se puede recalcular hacia atras sin
 * perder ni una venta.
 */
export function claveTerminal(evento) {
  const d = evento.data || {};
  if (d.card && d.card.terminal_id) return `terminal:${d.card.terminal_id}`;
  if (d.user_id) return `usuario:${d.user_id}`;
  return 'desconocido';
}

async function guardarVenta(env, v, cuerpoCrudo) {
  if (!v.payment_id) throw new Error('venta sin payment_id');

  // La clave especial de links/transferencias se auto-nombra: no tiene datafono
  // fisico que asignar a mano, asi que no debe caer en "sin asignar".
  if (v.clave_terminal === CLAVE_LINK) {
    await env.DB.prepare(
      `INSERT INTO locales (clave_terminal, nombre, creado_en) VALUES (?,?,?)
       ON CONFLICT(clave_terminal) DO NOTHING`,
    ).bind(CLAVE_LINK, NOMBRE_LINK, new Date().toISOString()).run();
  }

  // Si la anulacion llego primero, nace ya anulada.
  const pendiente = await env.DB.prepare(
    'SELECT payment_id FROM anulaciones_pendientes WHERE payment_id = ?',
  ).bind(v.payment_id).first();
  const anulada = pendiente ? 1 : 0;

  await env.DB.prepare(
    `INSERT INTO transacciones (
       payment_id, event_type, source, payment_method, clave_terminal, terminal_id,
       user_id, merchant_id, monto, propina, moneda, created_at, fecha_venta, canal,
       bold_code, referencia, vendedor, pagador, anulada, origen, raw, recibida_en
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(payment_id) DO UPDATE SET
       monto = excluded.monto,
       propina = excluded.propina,
       clave_terminal = excluded.clave_terminal,
       canal = excluded.canal,
       pagador = excluded.pagador,
       raw = excluded.raw`,
  ).bind(
    v.payment_id, v.event_type, v.source, v.payment_method, v.clave_terminal, v.terminal_id,
    v.user_id, v.merchant_id, v.monto, v.propina, v.moneda, v.created_at, v.fecha_venta, v.canal || null,
    v.bold_code, v.referencia, v.vendedor, v.pagador || null, anulada, v.origen,
    cuerpoCrudo || JSON.stringify(v), new Date().toISOString(),
  ).run();

  if (pendiente) {
    await env.DB.prepare('DELETE FROM anulaciones_pendientes WHERE payment_id = ?')
      .bind(v.payment_id).run();
  }
}

async function logEvento(env, eventId, tipo, ok, detalle, raw) {
  try {
    await env.DB.prepare(
      'INSERT INTO eventos_log (event_id, event_type, ok, detalle, raw, recibido_en) VALUES (?,?,?,?,?,?)',
    ).bind(eventId || null, tipo || null, ok, detalle || null, raw, new Date().toISOString()).run();
  } catch {
    // El log nunca debe tumbar el webhook.
  }
}

/* ------------------------------------------------------------------ *
 * Fechas — Bold manda ISO con offset -05:00; el corte del dia es Bogota.
 * ------------------------------------------------------------------ */

export function fechaBogota(iso) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return new Date().toISOString().slice(0, 10);
  return new Date(ms + ZONA_OFFSET_HORAS * 3600 * 1000).toISOString().slice(0, 10);
}

function hoyBogota() {
  return new Date(Date.now() + ZONA_OFFSET_HORAS * 3600 * 1000).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ *
 * API del dashboard
 * ------------------------------------------------------------------ */

// Totales por local y por dia. Las anuladas no suman.
async function apiResumen(request, env) {
  const url = new URL(request.url);
  const desde = url.searchParams.get('desde') || hoyBogota();
  const hasta = url.searchParams.get('hasta') || desde;

  // Agrupamos por nombre de local, no por clave: un mismo datafono puede tener
  // dos claves (una del webhook, otra del reporte importado) y debe salir junto.
  const { results } = await env.DB.prepare(
    `SELECT t.fecha_venta,
            COALESCE(l.nombre, t.clave_terminal) AS grupo,
            MAX(CASE WHEN l.nombre IS NULL THEN 0 ELSE 1 END) AS asignado,
            COUNT(*)     AS ventas,
            SUM(t.monto) AS total,
            SUM(t.propina) AS propinas
       FROM transacciones t
       LEFT JOIN locales l ON l.clave_terminal = t.clave_terminal
      WHERE t.fecha_venta BETWEEN ? AND ?
        AND t.anulada = 0
      GROUP BY t.fecha_venta, grupo
      ORDER BY t.fecha_venta DESC, total DESC`,
  ).bind(desde, hasta).all();

  const anuladas = await env.DB.prepare(
    `SELECT COUNT(*) AS n, COALESCE(SUM(monto), 0) AS total
       FROM transacciones
      WHERE fecha_venta BETWEEN ? AND ? AND anulada = 1`,
  ).bind(desde, hasta).first();

  return json({ desde, hasta, filas: results, anuladas });
}

// Detalle transaccion por transaccion, para cuadrar contra lo que reporta la muchacha.
async function apiTransacciones(request, env) {
  const url = new URL(request.url);
  const fecha = url.searchParams.get('fecha') || hoyBogota();
  // `grupo` es el nombre del local si ya esta asignado; si no, la clave cruda.
  const grupo = url.searchParams.get('grupo');

  const sql = `SELECT t.payment_id, t.created_at, t.monto, t.propina, t.payment_method,
                      t.clave_terminal, t.canal, t.anulada, t.referencia, t.pagador, t.origen,
                      COALESCE(l.nombre, t.clave_terminal) AS grupo
                 FROM transacciones t
                 LEFT JOIN locales l ON l.clave_terminal = t.clave_terminal
                WHERE t.fecha_venta = ?
                  ${grupo ? 'AND COALESCE(l.nombre, t.clave_terminal) = ?' : ''}
                ORDER BY t.created_at ASC`;

  const stmt = grupo
    ? env.DB.prepare(sql).bind(fecha, grupo)
    : env.DB.prepare(sql).bind(fecha);
  const { results } = await stmt.all();
  return json({ fecha, transacciones: results });
}

// Pantalla de descubrimiento: que claves existen, cuantas ventas tiene cada una,
// cuando se vio por primera y ultima vez. Con esto identificas cada datafono.
async function apiTerminales(env) {
  const { results } = await env.DB.prepare(
    `SELECT t.clave_terminal,
            l.nombre,
            COUNT(*)          AS ventas,
            SUM(t.monto)      AS total,
            MIN(t.created_at) AS primera,
            MAX(t.created_at) AS ultima,
            MAX(t.payment_method) AS metodo,
            MAX(t.canal)      AS canal
       FROM transacciones t
       LEFT JOIN locales l ON l.clave_terminal = t.clave_terminal
      GROUP BY t.clave_terminal
      ORDER BY ultima DESC`,
  ).all();
  return json({ terminales: results });
}

async function apiGuardarTerminal(request, env) {
  const { clave_terminal, nombre } = await request.json();
  if (!clave_terminal || !nombre) return json({ error: 'faltan clave_terminal o nombre' }, 400);

  await env.DB.prepare(
    `INSERT INTO locales (clave_terminal, nombre, creado_en) VALUES (?,?,?)
     ON CONFLICT(clave_terminal) DO UPDATE SET nombre = excluded.nombre`,
  ).bind(clave_terminal, String(nombre).trim(), new Date().toISOString()).run();

  return json({ ok: true });
}

// Ultimos eventos crudos: sirve para verificar que Bold si esta llegando.
async function apiEventos(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, event_id, event_type, ok, detalle, recibido_en FROM eventos_log ORDER BY id DESC LIMIT 50',
  ).all();
  return json({ eventos: results });
}

/* ------------------------------------------------------------------ *
 * Importacion del reporte de Bold (lo manda scripts/import-report.mjs)
 * ------------------------------------------------------------------ */

async function importarLote(request, env) {
  const token = request.headers.get('x-admin-token');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json({ error: 'no autorizado' }, 401);

  const { filas } = await request.json();
  if (!Array.isArray(filas)) return json({ error: 'se esperaba { filas: [] }' }, 400);

  let insertadas = 0;
  const errores = [];

  for (const f of filas) {
    try {
      if (!f.payment_id) throw new Error('fila sin payment_id');
      await guardarVenta(env, {
        payment_id: String(f.payment_id),
        event_type: 'SALE_APPROVED',
        source: f.source || null,
        payment_method: f.payment_method || null,
        // Sin serial de datafono = no paso por un dispositivo fisico: link de pago,
        // transferencia, etc. Todas esas van juntas bajo CLAVE_LINK, sea cual sea
        // el metodo o canal especifico (eso queda en el detalle, no en la clave).
        clave_terminal: f.clave_terminal === 'desconocido' ? CLAVE_LINK : (f.clave_terminal || CLAVE_LINK),
        terminal_id: f.terminal_id || null,
        user_id: f.user_id || null,
        merchant_id: f.merchant_id || null,
        monto: Math.round(Number(f.monto) || 0),
        propina: Math.round(Number(f.propina) || 0),
        moneda: f.moneda || 'COP',
        created_at: f.created_at,
        fecha_venta: fechaBogota(f.created_at),
        canal: f.canal || null,
        bold_code: f.bold_code || null,
        referencia: f.referencia || null,
        vendedor: f.vendedor || null,
        pagador: f.pagador || null,
        origen: 'importacion',
      }, JSON.stringify(f));
      insertadas++;
    } catch (e) {
      errores.push({ payment_id: f.payment_id || null, error: String(e && e.message || e) });
    }
  }

  return json({ ok: true, insertadas, errores });
}

/* ------------------------------------------------------------------ */

function json(objeto, status = 200) {
  return new Response(JSON.stringify(objeto), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function html(cuerpo, status = 200) {
  return new Response(cuerpo, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
