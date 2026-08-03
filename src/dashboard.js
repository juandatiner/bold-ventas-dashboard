/* ------------------------------------------------------------------ *
 * Personalización del negocio. Cambiar estas líneas es todo lo que hace
 * falta para levantar una instancia nueva: el resto del código es igual.
 * ------------------------------------------------------------------ */
const NEGOCIO = 'Mi Negocio';
const SUBTITULO = 'Ventas';

// Icono de la marca: se usa en el cabezote y como favicon. Va como SVG en un
// data: URI, asi la pestaña tiene icono sin pedir un archivo extra a la red.
const ICONO = '🛍️';

const ICONO_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<text x='50' y='52' font-size='76' text-anchor='middle' " +
  "dominant-baseline='central'>" + ICONO + "</text></svg>";

export const iconoSvg = ICONO_SVG;

const ETIQUETAS_ICONO =
  '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(ICONO_SVG) + '">' +
  '<link rel="apple-touch-icon" href="data:image/svg+xml,' + encodeURIComponent(ICONO_SVG) + '">';

// Patrón de fondo. Va como SVG embebido: sin pedir nada a internet, el
// celular no gasta datos y carga al instante. Tres tamaños y una rotación
// suave por figura para que no se vea como cuadrícula repetida.
const FONDO_PATRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E" +
  "%3Ctext x='18' y='58' font-size='40' transform='rotate(-8 18 58)'%3E%26%23128717%3B%3C/text%3E" +
  "%3Ctext x='130' y='40' font-size='26' transform='rotate(10 130 40)'%3E%26%23128179%3B%3C/text%3E" +
  "%3Ctext x='150' y='150' font-size='46' transform='rotate(6 150 150)'%3E%26%23128717%3B%3C/text%3E" +
  "%3Ctext x='30' y='170' font-size='24' transform='rotate(-12 30 170)'%3E%26%23128179%3B%3C/text%3E" +
  "%3C/svg%3E\")";

const ESTILOS = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --fondo: #fdf5fb;
    --tarjeta: #ffffff;
    --borde: #f1def0;
    --texto: #4a3350;
    --suave: #9884a3;
    --rosa: #ffa8c9;
    --rosa-texto: #d95e84;
    --rosa-suave: #ffe6f1;
    --naranja: #ffcd94;
    --naranja-texto: #cc7638;
    --verde: #3fae7a;
    --rojo: #c93a63;
    --sombra: 0 2px 4px rgba(160,110,170,.07), 0 10px 28px rgba(160,110,170,.10);
    --patron: .06;
  }

  html { -webkit-text-size-adjust: 100%; font-size: clamp(16px, 4vw, 18px); }
  body {
    margin: 0; min-height: 100dvh; background: var(--fondo); color: var(--texto);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased; overflow-x: hidden;
  }
  /* Capa del patrón, detrás de todo y sin estorbar los toques. */
  body::before {
    content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: ${FONDO_PATRON}; opacity: var(--patron);
  }
  .envoltura { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 0 14px 64px; }

  /* ---- Encabezado ---- */
  .cabezote {
    margin: 0 -14px 16px; padding: 22px 18px 24px;
    background: linear-gradient(135deg, #c94571 0%, #b05522 100%);
    color: #fff; border-radius: 0 0 28px 28px;
    box-shadow: 0 6px 22px rgba(201,69,113,.30);
  }
  .marca { display: flex; align-items: center; gap: 10px; }
  .marca .icono { font-size: clamp(32px, 8vw, 40px); line-height: 1; filter: drop-shadow(0 2px 3px rgba(0,0,0,.15)); }
  .marca h1 { font-size: clamp(21px, 5.5vw, 26px); margin: 0; font-weight: 750; letter-spacing: -.02em; line-height: 1.15; }
  .marca .sub { font-size: clamp(12px, 3vw, 14px); opacity: .92; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }

  /* ---- Barra de fecha ---- */
  .barra-fecha {
    display: flex; align-items: center; gap: 8px; margin-top: 16px;
    background: rgba(255,255,255,.18); padding: 6px; border-radius: 14px;
  }
  .barra-fecha button {
    background: rgba(255,255,255,.24); border: 0; color: #fff; font: inherit; font-weight: 700;
    font-size: clamp(17px, 4.5vw, 20px);
    min-width: 46px; height: 48px; border-radius: 12px; cursor: pointer; flex: none;
  }
  .barra-fecha button:active { transform: scale(.94); }
  .barra-fecha button:disabled { opacity: .35; cursor: default; }
  .barra-fecha button:disabled:active { transform: none; }
  .barra-fecha input[type=date] {
    flex: 1; min-width: 0; font: inherit; font-weight: 650; font-size: clamp(15px, 4vw, 17px); text-align: center;
    background: rgba(255,255,255,.24); border: 0; color: #fff; height: 48px;
    border-radius: 12px; padding: 0 8px;
  }
  .barra-fecha input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: .85; }
  .btn-hoy { padding: 0 16px !important; font-size: clamp(14px, 3.5vw, 16px) !important; }

  /* ---- Total del dia ---- */
  .total-dia {
    background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 22px;
    padding: 22px 20px; box-shadow: var(--sombra); margin-bottom: 16px; text-align: center;
  }
  .total-dia .etiqueta {
    font-size: clamp(12px, 3vw, 14px); color: var(--suave); text-transform: uppercase;
    letter-spacing: .1em; font-weight: 750;
  }
  .total-dia .cifra {
    font-size: clamp(42px, 13vw, 64px); font-weight: 800; letter-spacing: -.035em;
    margin: 8px 0 6px; line-height: 1;
    background: linear-gradient(135deg, var(--rosa-texto), var(--naranja-texto));
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: var(--rosa-texto);
  }
  .total-dia .sub { color: var(--suave); font-size: clamp(14px, 3.8vw, 17px); font-weight: 600; }
  .total-dia .anuladas { color: var(--rojo); font-size: clamp(13px, 3.3vw, 15px); margin-top: 10px; font-weight: 650; }

  /* ---- Tarjetas por local ---- */
  .locales { display: grid; gap: 12px; }
  @media (min-width: 620px) { .locales { grid-template-columns: 1fr 1fr; } }

  .local {
    position: relative; overflow: hidden; width: 100%; text-align: left; cursor: pointer;
    background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 20px;
    padding: 18px 18px 18px 22px; box-shadow: var(--sombra); color: inherit; font: inherit;
    transition: transform .12s ease;
  }
  .local::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 7px;
    background: var(--color-local);
  }
  .local::after {
    content: var(--emoji-local); position: absolute; right: -6px; bottom: -14px;
    font-size: 74px; opacity: .1; pointer-events: none;
  }
  .local:active { transform: scale(.985); }
  .local .fila-nombre { display: flex; align-items: center; gap: 8px; }
  .local .punto { width: 11px; height: 11px; border-radius: 50%; background: var(--color-local); flex: none; }
  .local .nombre { font-size: clamp(17px, 4.5vw, 20px); font-weight: 750; letter-spacing: -.01em; }
  .local .flecha { margin-left: auto; color: var(--suave); font-size: clamp(24px, 6vw, 27px); line-height: 1; }
  .local .monto {
    font-size: clamp(32px, 9.5vw, 40px); font-weight: 780;
    letter-spacing: -.03em; margin: 10px 0 4px; color: var(--color-local);
  }
  .local .meta { color: var(--suave); font-size: clamp(14px, 3.6vw, 16px); font-weight: 600; }
  .local .porcentaje {
    display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 999px;
    background: var(--fondo); border: 1px solid var(--borde);
    font-size: clamp(12.5px, 3.2vw, 14px); font-weight: 700; color: var(--suave);
  }

  /* ---- Avisos ---- */
  .aviso {
    background: var(--tarjeta); border: 2px dashed var(--borde); border-radius: 20px;
    padding: 28px 20px; color: var(--suave); text-align: center;
    font-size: clamp(15px, 4vw, 17px); line-height: 1.55;
  }
  .aviso .grande { font-size: clamp(44px, 11vw, 52px); display: block; margin-bottom: 12px; }
  .titulo-seccion {
    font-size: clamp(12.5px, 3.2vw, 14px); font-weight: 750; text-transform: uppercase; letter-spacing: .09em;
    color: var(--suave); margin: 26px 0 10px;
  }
  /* ---- Detalle ---- */
  .volver {
    background: var(--tarjeta); border: 1px solid var(--borde); color: var(--texto);
    font: inherit; font-weight: 700; font-size: clamp(15px, 4vw, 17px);
    padding: 12px 20px; border-radius: 999px;
    margin-bottom: 14px; cursor: pointer; box-shadow: var(--sombra); min-height: 46px;
  }
  .cabeza-detalle {
    background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 20px;
    padding: 22px; box-shadow: var(--sombra); margin-bottom: 14px;
    border-left: 7px solid var(--color-local, var(--rosa-texto));
  }
  .cabeza-detalle h2 { margin: 0; font-size: clamp(22px, 6vw, 27px); font-weight: 780; letter-spacing: -.02em; }
  .cabeza-detalle .fecha { color: var(--suave); font-size: clamp(14px, 3.6vw, 16px); margin-top: 4px; font-weight: 600; }
  .cabeza-detalle .gran-total {
    font-size: clamp(36px, 10vw, 46px); font-weight: 800; letter-spacing: -.03em;
    margin-top: 14px; color: var(--color-local, var(--rosa-texto));
  }
  .cabeza-detalle .conteo { color: var(--suave); font-size: clamp(14px, 3.6vw, 16px); font-weight: 600; }

  .lista-tx { display: grid; gap: 9px; }
  .tx {
    display: flex; align-items: center; gap: 12px;
    background: var(--tarjeta); border: 1px solid var(--borde);
    border-radius: 15px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(160,110,170,.05);
  }
  .tx .hora {
    font-size: clamp(13.5px, 3.5vw, 15px); font-weight: 700; color: var(--suave);
    font-variant-numeric: tabular-nums; min-width: 74px; flex: none;
  }
  .tx .medio { font-size: clamp(12px, 3vw, 13.5px); color: var(--suave); font-weight: 600; }
  .tx .centro { min-width: 0; flex: 1; }
  .tx .valor {
    margin-left: auto; font-size: clamp(18px, 4.8vw, 21px); font-weight: 750;
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .tx.anulada { opacity: .6; }
  .tx.anulada .valor { text-decoration: line-through; color: var(--rojo); }
  .tx .sello {
    display: inline-block; margin-top: 3px; font-size: clamp(11px, 2.8vw, 12.5px); font-weight: 750;
    color: #a6395a; background: var(--rosa-suave); padding: 2px 8px; border-radius: 999px;
  }
  .oculto { display: none; }
  .cargando { text-align: center; color: var(--suave); padding: 40px 0; font-size: clamp(14px, 3.6vw, 16px); }
`;

const CABEZOTE = `
  <div class="cabezote">
    <div class="marca">
      <span class="icono">${ICONO}</span>
      <div>
        <h1>${NEGOCIO}</h1>
        <div class="sub">${SUBTITULO}</div>
      </div>
    </div>
    <div class="barra-fecha">
      <button id="ayer" aria-label="Día anterior">&#8249;</button>
      <input type="date" id="fecha">
      <button id="manana" aria-label="Día siguiente">&#8250;</button>
      <button id="hoy" class="btn-hoy">Hoy</button>
      <button id="recargar" aria-label="Forzar recarga">&#8635;</button>
    </div>
  </div>`;

export function paginaDashboard() {
  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#c94571">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${NEGOCIO} · Ventas</title>${ETIQUETAS_ICONO}<style>${ESTILOS}</style></head><body>
<div class="envoltura">
  ${CABEZOTE}

  <section id="vista-resumen">
    <div class="total-dia">
      <div class="etiqueta">Total del día</div>
      <div class="cifra" id="total-general">—</div>
      <div class="sub" id="sub-general"></div>
      <div class="anuladas oculto" id="anuladas"></div>
    </div>
    <div class="locales" id="locales"><div class="cargando">Cargando…</div></div>
  </section>

  <section id="vista-detalle" class="oculto">
    <button class="volver" id="volver">&#8249;&nbsp; Volver</button>
    <div class="cabeza-detalle" id="cabeza-detalle">
      <h2 id="detalle-nombre"></h2>
      <div class="fecha" id="detalle-fecha"></div>
      <div class="gran-total" id="detalle-total"></div>
      <div class="conteo" id="detalle-conteo"></div>
    </div>
    <div class="lista-tx" id="detalle-filas"></div>
  </section>
</div>

<script>
const $ = id => document.getElementById(id);

const pesos = n => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(Number(n) || 0);

// El corte del dia es Bogota (UTC-5), no la hora del celular.
const hoyBogota = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);

const fechaLarga = f => {
  const [a, m, d] = f.split('-').map(Number);
  const t = new Date(a, m - 1, d).toLocaleDateString('es-CO',
    { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const hora = iso => {
  // created_at ya viene con offset -05:00; mostramos esa misma hora.
  const m = String(iso).match(/T(\\d{2}):(\\d{2})/);
  if (!m) return '—';
  let h = Number(m[1]);
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12 || 12;
  return h + ':' + m[2] + ' ' + ampm;
};

const escapar = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Color y emoji estables por local: el mismo nombre siempre se ve igual.
const PALETA = ['#d95e84', '#cc7638', '#8362cf', '#1f8fbd', '#259368', '#b8791f'];
const EMOJIS = ['\\'🛍️\\'', '\\'🍽️\\'', '\\'🏪\\'', '\\'🧰\\'', '\\'🛵\\'', '\\'⭐\\''];
// Emojis fijos para los locales conocidos; cualquier otro cae al hash de abajo.
const EMOJIS_FIJOS = {
  'Link y transferencias': '\\'💸\\'',
};
function indiceDe(nombre) {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return h;
}
const colorDe = n => PALETA[indiceDe(n) % PALETA.length];
const emojiDe = n => EMOJIS_FIJOS[n] || EMOJIS[indiceDe(n) % EMOJIS.length];

let fechaActual = hoyBogota();
// Local abierto en el detalle, o null si se está viendo el resumen. Permite
// refrescar y cambiar de día sin sacar al usuario de donde está.
let grupoActual = null;

/* ---------------- Resumen ---------------- */

// La barra de fecha vive en el cabezote, encima de ambas vistas.
function sincronizarBarraFecha() {
  $('fecha').value = fechaActual;
  $('fecha').max = hoyBogota();
  $('manana').disabled = fechaActual >= hoyBogota();
}

async function cargarResumen() {
  grupoActual = null;
  sincronizarBarraFecha();
  let datos;
  try {
    const r = await fetch('/api/resumen?desde=' + fechaActual + '&hasta=' + fechaActual);
    datos = await r.json();
  } catch {
    $('locales').innerHTML = '<div class="aviso"><span class="grande">📡</span>' +
      'Sin conexión. Revisa el internet del celular e intenta otra vez.</div>';
    return;
  }

  const filas = datos.filas || [];
  const total = filas.reduce((s, f) => s + Number(f.total || 0), 0);
  const ventas = filas.reduce((s, f) => s + Number(f.ventas || 0), 0);

  $('total-general').textContent = pesos(total);
  $('sub-general').textContent = fechaLarga(fechaActual) + ' · ' +
    ventas + (ventas === 1 ? ' venta' : ' ventas');

  const a = $('anuladas');
  if (datos.anuladas && datos.anuladas.n > 0) {
    a.classList.remove('oculto');
    a.textContent = datos.anuladas.n + ' anulada' + (datos.anuladas.n === 1 ? '' : 's') +
      ' por ' + pesos(datos.anuladas.total) + ' — no suman';
  } else {
    a.classList.add('oculto');
  }

  // Las que aun no tienen nombre salen igual, con su clave cruda como
  // etiqueta: se renombran solas cuando llega el reporte de Bold con el
  // serial del datafono (ver README, "Cargar el historial viejo").
  $('locales').innerHTML = filas.length
    ? filas.map(f => tarjeta(f, total)).join('')
    : '<div class="aviso"><span class="grande">🛍️</span>' +
      'Todavía no hay ventas registradas este día.</div>';

  document.querySelectorAll('.local').forEach(el => {
    el.onclick = () => abrirDetalle(el.dataset.grupo);
  });
}

function tarjeta(f, totalDia) {
  const nombre = f.grupo;
  const sinAsignar = !f.asignado;
  const color = sinAsignar ? '#94a3b8' : colorDe(nombre);
  const pct = totalDia > 0 ? Math.round((Number(f.total) / totalDia) * 100) : 0;

  return '<button class="local" data-grupo="' + escapar(nombre) + '"' +
    ' style="--color-local:' + color + ';--emoji-local:' +
      (sinAsignar ? "'❓'" : emojiDe(nombre)) + '">' +
    '<div class="fila-nombre">' +
      '<span class="punto"></span>' +
      '<span class="nombre">' + escapar(nombre) + '</span>' +
      '<span class="flecha">&#8250;</span>' +
    '</div>' +
    '<div class="monto">' + pesos(f.total) + '</div>' +
    '<div class="meta">' + f.ventas + (f.ventas === 1 ? ' venta' : ' ventas') +
      (Number(f.propinas) > 0 ? ' · ' + pesos(f.propinas) + ' propinas' : '') + '</div>' +
    (sinAsignar
      ? ''
      : '<span class="porcentaje">' + pct + '% del día</span>') +
    '</button>';
}

/* ---------------- Detalle ---------------- */

async function abrirDetalle(grupo, nuevo = true) {
  grupoActual = grupo;
  sincronizarBarraFecha();
  $('vista-resumen').classList.add('oculto');
  $('vista-detalle').classList.remove('oculto');
  // En un refresco de fondo no se toca el scroll ni se muestra "Cargando…":
  // el usuario está leyendo la lista, no esperándola.
  if (nuevo) {
    $('detalle-filas').innerHTML = '<div class="cargando">Cargando…</div>';
    scrollTo(0, 0);
  }

  const color = colorDe(grupo);
  $('cabeza-detalle').style.setProperty('--color-local', color);
  $('detalle-nombre').textContent = grupo;
  $('detalle-fecha').textContent = fechaLarga(fechaActual);

  const r = await fetch('/api/transacciones?fecha=' + fechaActual +
    '&grupo=' + encodeURIComponent(grupo));
  const tx = (await r.json()).transacciones || [];

  const validas = tx.filter(t => !t.anulada);
  $('detalle-total').textContent =
    pesos(validas.reduce((s, t) => s + Number(t.monto || 0), 0));
  $('detalle-conteo').textContent =
    validas.length + (validas.length === 1 ? ' venta' : ' ventas');

  $('detalle-filas').innerHTML = tx.length
    ? tx.map(t => {
        const etiqueta = t.canal || t.payment_method || '—';
        return '<div class="tx' + (t.anulada ? ' anulada' : '') + '">' +
          '<span class="hora">' + hora(t.created_at) + '</span>' +
          '<span class="centro">' +
            '<span class="medio">' + escapar(etiqueta) +
            (t.pagador ? ' · ' + escapar(t.pagador) : '') + '</span>' +
            (t.anulada ? '<br><span class="sello">ANULADA</span>' : '') +
          '</span>' +
          '<span class="valor">' + pesos(t.monto) + '</span>' +
        '</div>';
      }).join('')
    : '<div class="aviso"><span class="grande">🛍️</span>Sin ventas este día.</div>';
}

function volverAlResumen() {
  $('vista-detalle').classList.add('oculto');
  $('vista-resumen').classList.remove('oculto');
  cargarResumen();
}

// Recarga lo que se esté viendo. Del detalle solo se sale con "Volver": ni un
// refresco, ni cambiar de día, ni un deslizamiento deben sacar al usuario de
// la lista que está leyendo.
function refrescarVista() {
  return grupoActual ? abrirDetalle(grupoActual, false) : cargarResumen();
}

function moverDia(dias) {
  const d = new Date(fechaActual + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  const nueva = d.toISOString().slice(0, 10);
  if (nueva > hoyBogota()) return; // no se puede ver el futuro
  fechaActual = nueva;
  // Si estaba viendo un local, sigue viendo ese mismo local en el día nuevo.
  if (grupoActual) abrirDetalle(grupoActual);
  else cargarResumen();
}

/* ---------------- Eventos ---------------- */

$('volver').onclick = volverAlResumen;
$('ayer').onclick = () => moverDia(-1);
$('manana').onclick = () => moverDia(1);
$('hoy').onclick = () => {
  if (fechaActual === hoyBogota()) return;
  fechaActual = hoyBogota();
  if (grupoActual) abrirDetalle(grupoActual);
  else cargarResumen();
};
$('recargar').onclick = () => {
  const b = $('recargar');
  b.disabled = true;
  Promise.resolve(refrescarVista()).finally(() => { b.disabled = false; });
};
$('fecha').onchange = e => {
  fechaActual = e.target.value > hoyBogota() ? hoyBogota() : e.target.value;
  if (grupoActual) abrirDetalle(grupoActual);
  else cargarResumen();
};

// Deslizar el dedo cambia de día, en cualquiera de las dos vistas.
let x0 = null, y0 = null;
addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
addEventListener('touchend', e => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  const dy = e.changedTouches[0].clientY - y0;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) moverDia(dx > 0 ? -1 : 1);
  x0 = null;
}, { passive: true });

cargarResumen();

// Refresco automático solo en el día de hoy, respetando la vista abierta.
setInterval(() => { if (fechaActual === hoyBogota()) refrescarVista(); }, 60000);
// En móvil el temporizador se congela en segundo plano: al volver, refrescar.
addEventListener('visibilitychange', () => {
  if (!document.hidden && fechaActual === hoyBogota()) refrescarVista();
});
</script>
</body></html>`;
}
