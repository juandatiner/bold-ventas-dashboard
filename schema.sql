-- Esquema de la base de ventas Bold.
-- Correr con: npm run db:init  (remoto)  |  npm run db:init:local

CREATE TABLE IF NOT EXISTS transacciones (
  payment_id     TEXT PRIMARY KEY,
  event_type     TEXT NOT NULL,            -- SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED
  source         TEXT,                     -- /payments | /payments/qr
  payment_method TEXT,                     -- CARD | QR | ...
  clave_terminal TEXT NOT NULL,            -- discriminador del datafono/QR (ver src/index.js: claveTerminal)
  terminal_id    TEXT,                     -- solo pagos CARD
  user_id        TEXT,
  merchant_id    TEXT,
  monto          INTEGER NOT NULL,         -- COP, pesos enteros
  propina        INTEGER NOT NULL DEFAULT 0,
  moneda         TEXT NOT NULL DEFAULT 'COP',
  created_at     TEXT NOT NULL,            -- ISO original de Bold, con offset -05:00
  fecha_venta    TEXT NOT NULL,            -- YYYY-MM-DD ya convertido a hora Bogota
  canal          TEXT,                     -- "CANAL DE VENTAS" del reporte: SonoQR, Link de pago, Transferencia...
  bold_code      TEXT,
  referencia     TEXT,
  vendedor       TEXT,                     -- quien esta a cargo de la cuenta Bold (poco util: siempre el mismo)
  pagador        TEXT,                     -- nombre de quien realizo el pago (cliente)
  anulada        INTEGER NOT NULL DEFAULT 0,
  origen         TEXT NOT NULL DEFAULT 'webhook',  -- webhook | importacion
  raw            TEXT NOT NULL,            -- payload completo, para poder re-deducir campos despues
  recibida_en    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_fecha  ON transacciones (fecha_venta);
CREATE INDEX IF NOT EXISTS idx_tx_clave  ON transacciones (clave_terminal, fecha_venta);

-- Mapa clave_terminal -> nombre del local. Lo llenas desde el dashboard.
CREATE TABLE IF NOT EXISTS locales (
  clave_terminal TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL,
  creado_en      TEXT NOT NULL
);

-- Anulaciones que llegaron antes que su venta original (fuera de orden).
-- Se aplican cuando la venta aparezca.
CREATE TABLE IF NOT EXISTS anulaciones_pendientes (
  payment_id TEXT PRIMARY KEY,
  recibida_en TEXT NOT NULL
);

-- Log crudo de todo evento recibido, incluso los que no se pudieron procesar.
CREATE TABLE IF NOT EXISTS eventos_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    TEXT,
  event_type  TEXT,
  ok          INTEGER NOT NULL,
  detalle     TEXT,
  raw         TEXT NOT NULL,
  recibido_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_log_fecha ON eventos_log (recibido_en);
