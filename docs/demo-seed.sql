-- Datos ficticios, solo para generar las capturas de pantalla del README.
-- Nada de esto corresponde a ventas ni a terminales reales.

DELETE FROM transacciones;
DELETE FROM locales;

INSERT INTO locales (clave_terminal, nombre, creado_en) VALUES
  ('terminal:DEMO-A1', 'Sede Norte',            '2026-05-01T09:00:00Z'),
  ('terminal:DEMO-B2', 'Sede Centro',           '2026-05-01T09:00:00Z'),
  ('terminal:DEMO-C3', 'Punto Móvil',           '2026-05-01T09:00:00Z'),
  ('link-transferencia', 'Link y transferencias','2026-05-01T09:00:00Z');

INSERT INTO transacciones
  (payment_id, event_type, source, payment_method, clave_terminal, terminal_id,
   user_id, merchant_id, monto, propina, moneda, created_at, fecha_venta, canal,
   bold_code, referencia, vendedor, pagador, anulada, origen, raw, recibida_en)
VALUES
  ('DEMO001','SALE_APPROVED','/payments','CARD','terminal:DEMO-A1','DEMO-A1',NULL,'DEMO',  48000, 0,'COP','2026-05-14T08:12:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,'Ana Gómez',   0,'webhook','{}','2026-05-14T13:12:05Z'),
  ('DEMO002','SALE_APPROVED','/payments/qr','QR','terminal:DEMO-A1','DEMO-A1',NULL,'DEMO', 125000, 0,'COP','2026-05-14T09:47:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,NULL,          0,'webhook','{}','2026-05-14T14:47:04Z'),
  ('DEMO003','SALE_APPROVED','/payments','CARD','terminal:DEMO-A1','DEMO-A1',NULL,'DEMO',  32500, 3000,'COP','2026-05-14T11:20:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,'Luis Parra', 0,'webhook','{}','2026-05-14T16:20:03Z'),
  ('DEMO004','SALE_APPROVED','/payments','CARD','terminal:DEMO-A1','DEMO-A1',NULL,'DEMO',  89000, 0,'COP','2026-05-14T13:05:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,'Marta Ruiz',  0,'webhook','{}','2026-05-14T18:05:02Z'),
  ('DEMO005','SALE_APPROVED','/payments','CARD','terminal:DEMO-A1','DEMO-A1',NULL,'DEMO',  15000, 0,'COP','2026-05-14T15:38:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,NULL,          0,'webhook','{}','2026-05-14T20:38:06Z'),

  ('DEMO010','SALE_APPROVED','/payments','CARD','terminal:DEMO-B2','DEMO-B2',NULL,'DEMO',  67000, 0,'COP','2026-05-14T08:55:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,'Carlos Díaz', 0,'webhook','{}','2026-05-14T13:55:03Z'),
  ('DEMO011','SALE_APPROVED','/payments/qr','QR','terminal:DEMO-B2','DEMO-B2',NULL,'DEMO',  42000, 0,'COP','2026-05-14T10:31:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,NULL,          0,'webhook','{}','2026-05-14T15:31:05Z'),
  ('DEMO012','SALE_APPROVED','/payments','CARD','terminal:DEMO-B2','DEMO-B2',NULL,'DEMO',  95500, 5000,'COP','2026-05-14T12:47:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,'Sofía Rojas',0,'webhook','{}','2026-05-14T17:47:04Z'),
  ('DEMO013','SALE_APPROVED','/payments','CARD','terminal:DEMO-B2','DEMO-B2',NULL,'DEMO',  28000, 0,'COP','2026-05-14T16:02:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,NULL,          1,'webhook','{}','2026-05-14T21:02:03Z'),

  ('DEMO020','SALE_APPROVED','/payments','CARD','terminal:DEMO-C3','DEMO-C3',NULL,'DEMO',  53000, 0,'COP','2026-05-14T09:10:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,'Pedro Nieto', 0,'webhook','{}','2026-05-14T14:10:02Z'),
  ('DEMO021','SALE_APPROVED','/payments','CARD','terminal:DEMO-C3','DEMO-C3',NULL,'DEMO',  36500, 0,'COP','2026-05-14T14:25:00-05:00','2026-05-14','Datáfono','B000',NULL,NULL,NULL,          0,'webhook','{}','2026-05-14T19:25:05Z'),

  ('DEMO030','SALE_APPROVED',NULL,'Nequi','link-transferencia',NULL,NULL,'DEMO',           74000, 0,'COP','2026-05-14T10:05:00-05:00','2026-05-14','Link de pago','B000',NULL,NULL,NULL,     0,'importacion','{}','2026-05-15T02:00:00Z'),
  ('DEMO031','SALE_APPROVED',NULL,'Transferencia','link-transferencia',NULL,NULL,'DEMO',  110000, 0,'COP','2026-05-14T17:40:00-05:00','2026-05-14','Transferencia','B000',NULL,NULL,NULL,   0,'importacion','{}','2026-05-15T02:00:00Z'),

  -- Terminal recién estrenada: aún sin nombre asignado.
  ('DEMO040','SALE_APPROVED','/payments/qr','QR','usuario:11111111-2222-3333-4444-555555555555',NULL,'11111111-2222-3333-4444-555555555555','DEMO', 19000, 0,'COP','2026-05-14T18:15:00-05:00','2026-05-14',NULL,'B000',NULL,NULL,NULL,0,'webhook','{}','2026-05-14T23:15:04Z');
