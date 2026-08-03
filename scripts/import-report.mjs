#!/usr/bin/env node
/**
 * Importa el reporte de transacciones que Bold deja descargar desde su panel
 * (Excel) y lo carga en la base del dashboard.
 *
 *   node scripts/import-report.mjs reporte.xlsx --url https://bold-ventas.tu-cuenta.workers.dev --token TU_ADMIN_TOKEN
 *
 * Opciones:
 *   --dry            Solo muestra lo que haria, no envia nada.
 *   --columnas       Imprime los encabezados detectados y sale.
 *   --mapa a=b,c=d   Fuerza el mapeo de columnas (campo=EncabezadoDelExcel).
 *
 * Formato real del "Reporte diario de transacciones" de Bold (hoja "Consolidado"):
 *   fila 1: vacia
 *   fila 2: nombre del negocio
 *   fila 3: encabezados reales (ID TRANSACCIÓN, FECHA, OPERACIÓN, VALOR TOTAL,
 *           SERIAL DEL DATÁFONO, NOMBRE DEL DATÁFONO, METODO DE PAGO, ...)
 *   fila 4 en adelante: una transaccion por fila
 *
 * El script busca esa fila de encabezados por contenido (no por numero fijo),
 * asi que aguanta si Bold cambia cuantas filas de titulo pone antes.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';

const args = process.argv.slice(2);
const archivo = args.find((a) => !a.startsWith('--'));
const opcion = (nombre) => {
  const i = args.indexOf('--' + nombre);
  return i === -1 ? null : args[i + 1];
};
const bandera = (nombre) => args.includes('--' + nombre);

if (!archivo) {
  console.error('Falta el archivo. Uso: node scripts/import-report.mjs reporte.xlsx --url ... --token ...');
  process.exit(1);
}

/* --- Leer el archivo y encontrar la fila de encabezados -------------- */

const libro = xlsx.read(readFileSync(path.resolve(archivo)), { cellDates: true });
const hoja = libro.Sheets[libro.SheetNames[0]];
const filasCrudas = xlsx.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: null });

const normalizar = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const indiceEncabezados = filasCrudas.findIndex((fila) =>
  Array.isArray(fila) && fila.some((celda) => normalizar(celda).includes('idtransaccion')));

if (indiceEncabezados === -1) {
  console.error('No encontré la fila de encabezados (busco una columna con "ID Transacción").');
  console.error('Primeras filas del archivo, para revisar a mano:');
  filasCrudas.slice(0, 5).forEach((f, i) => console.error('  fila ' + i + ':', f));
  process.exit(1);
}

const encabezados = filasCrudas[indiceEncabezados].map((h) => (h == null ? '' : String(h).trim()));
const filas = filasCrudas.slice(indiceEncabezados + 1)
  .filter((fila) => fila.some((celda) => celda != null && celda !== ''))
  .map((fila) => Object.fromEntries(encabezados.map((h, i) => [h, fila[i] ?? null])));

if (!filas.length) {
  console.error('No hay filas de datos despues del encabezado (fila ' + indiceEncabezados + ').');
  process.exit(1);
}

if (bandera('columnas')) {
  console.log('Fila de encabezados: ' + indiceEncabezados + '\n');
  console.log('Encabezados detectados:\n');
  encabezados.forEach((h) => console.log('  - ' + h));
  console.log('\nEjemplo de la primera fila:\n');
  console.log(filas[0]);
  process.exit(0);
}

/* --- Detectar columnas ---------------------------------------------- */

// Encabezados reales del reporte de Bold, en orden de preferencia.
// Si Bold cambia el texto, cae a la busqueda aproximada de abajo.
const CANDIDATOS = {
  payment_id: ['idtransaccion'],
  created_at: ['fecha'],
  monto: ['valortotal', 'valordelacompra'],
  propina: ['propina'],
  payment_method: ['metododepago'],
  terminal: ['serialdeldatafono'],
  terminal_nombre: ['nombredeldatafono'],
  canal: ['canaldeventas'],
  pagador: ['nombredelpagador'],
  vendedor: ['realizadapor'],
  referencia: ['referenciadepago', 'referencia'],
  estado: ['operacion'],
};

// Ventas sin serial de datafono (link de pago, transferencia, etc.) van todas
// juntas bajo esta clave -- misma constante que usa el Worker (src/index.js).
const CLAVE_LINK = 'link-transferencia';

const mapaForzado = {};
if (opcion('mapa')) {
  for (const par of opcion('mapa').split(',')) {
    const [campo, encabezado] = par.split('=');
    if (campo && encabezado) mapaForzado[campo.trim()] = encabezado.trim();
  }
}

const mapa = {};
for (const [campo, alias] of Object.entries(CANDIDATOS)) {
  if (mapaForzado[campo]) { mapa[campo] = mapaForzado[campo]; continue; }
  // Respeta el orden de preferencia de `alias`: prueba cada uno por turno
  // (exacto primero, luego "contiene") antes de pasar al siguiente candidato.
  let encontrado = null;
  for (const a of alias) {
    encontrado = encabezados.find((h) => normalizar(h) === a) ||
      encabezados.find((h) => normalizar(h).includes(a));
    if (encontrado) break;
  }
  if (encontrado) mapa[campo] = encontrado;
}

const obligatorios = ['payment_id', 'created_at', 'monto'];
const faltantes = obligatorios.filter((c) => !mapa[c]);

if (faltantes.length) {
  console.error('No pude identificar estas columnas: ' + faltantes.join(', ') + '\n');
  console.error('Encabezados del archivo:');
  encabezados.forEach((h) => console.error('  - ' + h));
  console.error('\nCorrige con --mapa, por ejemplo:');
  console.error('  --mapa payment_id="ID Transaccion",created_at="Fecha",monto="Valor Total"');
  process.exit(1);
}

console.log('Encabezados en la fila ' + indiceEncabezados + ' del Excel. Mapeo de columnas:');
for (const [campo, encabezado] of Object.entries(mapa)) console.log('  ' + campo.padEnd(16) + ' <- ' + encabezado);
console.log('');

/* --- Convertir filas ------------------------------------------------ */

// Bold escribe los montos como "$60,000.00": coma de miles, punto decimal.
const aNumero = (v) => {
  if (v == null) return 0;
  const limpio = String(v).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  return Math.round(Number(limpio) || 0);
};

const p2 = (n) => String(n).padStart(2, '0');

const aFechaISO = (v) => {
  if (v instanceof Date && !isNaN(v)) return conOffsetBogota(v);
  const s = String(v).trim();
  // Formato de Bold: "2026-08-01 11:34:57"
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (iso) {
    const [, a, mes, d, h, min, seg] = iso;
    return `${a}-${mes}-${d}T${h}:${min}:${seg}-05:00`;
  }
  // Alternativo: "dd/mm/yyyy hh:mm(:ss)"
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})[ ,T]*(\d{1,2})?:?(\d{2})?:?(\d{2})?/);
  if (dmy) {
    const [, d, mes, a, h = '0', min = '0', seg = '0'] = dmy;
    return `${a}-${p2(mes)}-${p2(d)}T${p2(h)}:${p2(min)}:${p2(seg)}-05:00`;
  }
  const directo = new Date(s);
  if (!isNaN(directo)) return conOffsetBogota(directo);
  return null;
};

function conOffsetBogota(fecha) {
  // xlsx entrega la fecha sin zona; el reporte de Bold viene en hora Bogota.
  return `${fecha.getFullYear()}-${p2(fecha.getMonth() + 1)}-${p2(fecha.getDate())}` +
    `T${p2(fecha.getHours())}:${p2(fecha.getMinutes())}:${p2(fecha.getSeconds())}-05:00`;
}

// Lista blanca, no negra: Bold puede usar textos de estado que no hemos visto
// (p. ej. "COBRO NO REALIZADO"), y una lista negra los dejaria pasar por error.
// Solo se acepta lo que dice explicitamente "exitoso" y no es una anulacion.
const esVentaValida = (estadoNormalizado) =>
  estadoNormalizado.includes('exitos') &&
  !estadoNormalizado.includes('anulad') &&
  !estadoNormalizado.includes('revers');

const salida = [];
const descartadas = [];

for (const fila of filas) {
  const estado = mapa.estado ? normalizar(fila[mapa.estado]) : '';
  if (mapa.estado && !esVentaValida(estado)) {
    descartadas.push({ id: fila[mapa.payment_id], motivo: fila[mapa.estado] });
    continue;
  }

  const created_at = aFechaISO(fila[mapa.created_at]);
  const payment_id = fila[mapa.payment_id] != null ? String(fila[mapa.payment_id]).trim() : null;
  if (!payment_id || !created_at) {
    descartadas.push({ id: payment_id, motivo: 'sin id o sin fecha legible' });
    continue;
  }

  const serial = mapa.terminal ? String(fila[mapa.terminal] || '').trim() : '';
  const nombreDatafono = mapa.terminal_nombre ? String(fila[mapa.terminal_nombre] || '').trim() : '';
  const canal = mapa.canal ? String(fila[mapa.canal] || '').trim() : '';

  salida.push({
    payment_id,
    created_at,
    monto: aNumero(fila[mapa.monto]),
    propina: mapa.propina ? aNumero(fila[mapa.propina]) : 0,
    payment_method: mapa.payment_method ? String(fila[mapa.payment_method] || '').trim() || null : null,
    // El serial identifica el datafono de forma unica; el nombre que Bold le puso
    // (columna NOMBRE DEL DATÁFONO) viaja aparte solo como pista para reconocerlo.
    // Sin serial, no hubo datafono fisico: cae en la clave de links/transferencias.
    clave_terminal: serial ? `reporte:${serial}` : CLAVE_LINK,
    terminal_id: serial || null,
    nombre_datafono: nombreDatafono || null,
    canal: canal || null,
    vendedor: mapa.vendedor ? String(fila[mapa.vendedor] || '').trim() || null : null,
    pagador: mapa.pagador ? String(fila[mapa.pagador] || '').trim() || null : null,
    referencia: mapa.referencia ? String(fila[mapa.referencia] || '').trim() || null : null,
  });
}

console.log(`Filas leidas: ${filas.length}`);
console.log(`Listas para cargar: ${salida.length}`);
console.log(`Descartadas: ${descartadas.length}`);
if (descartadas.length) {
  console.log('  (rechazadas, anuladas o sin datos utiles)');
  descartadas.slice(0, 5).forEach((d) => console.log('    ' + d.id + ': ' + d.motivo));
}

const totalPesos = salida.reduce((s, f) => s + f.monto, 0);
console.log(`Suma de montos: ${totalPesos.toLocaleString('es-CO')} COP\n`);

const porTerminal = {};
for (const f of salida) {
  const etiqueta = f.clave_terminal === CLAVE_LINK
    ? `Link y transferencias${f.canal ? ` (ej. ${f.canal})` : ''}`
    : f.clave_terminal + (f.nombre_datafono ? ` (${f.nombre_datafono})` : '');
  porTerminal[etiqueta] = (porTerminal[etiqueta] || 0) + f.monto;
}
console.log('Por datafono detectado:');
for (const [k, v] of Object.entries(porTerminal)) console.log('  ' + k.padEnd(46) + v.toLocaleString('es-CO'));
console.log('');

if (bandera('dry')) {
  console.log('--dry activo: no se envio nada. Primera fila convertida:\n');
  console.log(salida[0]);
  process.exit(0);
}

/* --- Enviar --------------------------------------------------------- */

const url = opcion('url');
const token = opcion('token') || process.env.ADMIN_TOKEN;

if (!url || !token) {
  console.error('Faltan --url y --token (o la variable de entorno ADMIN_TOKEN).');
  process.exit(1);
}

const LOTE = 200;
let cargadas = 0;
const errores = [];

for (let i = 0; i < salida.length; i += LOTE) {
  const lote = salida.slice(i, i + LOTE);
  const r = await fetch(url.replace(/\/$/, '') + '/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ filas: lote }),
  });

  if (!r.ok) {
    console.error(`Lote ${i / LOTE + 1} fallo: HTTP ${r.status} ${await r.text()}`);
    process.exit(1);
  }

  const res = await r.json();
  cargadas += res.insertadas;
  if (res.errores?.length) errores.push(...res.errores);
  console.log(`Lote ${i / LOTE + 1}: ${res.insertadas} cargadas`);
}

console.log(`\nListo. ${cargadas} transacciones en la base.`);
if (errores.length) {
  console.log(`${errores.length} con error:`);
  errores.slice(0, 10).forEach((e) => console.log('  ' + e.payment_id + ': ' + e.error));
}
console.log('\nAbre el dashboard y ponle nombre a cada datafono en la seccion "sin asignar".');
