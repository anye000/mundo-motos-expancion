-- Seed 001: usuarios, concesionarios e interacciones de prueba
--
-- Idempotente: usa ON CONFLICT DO NOTHING sobre columnas únicas (email/nit).
-- Aplicar manualmente vía SQL editor de Supabase (o el runner de seeds).

INSERT INTO users (email, nombre, apellido, rol, estado)
VALUES
  ('admin@mundomotos.com', 'Admin', 'Sistema', 'admin', 'activo'),
  ('gerente1@mundomotos.com', 'Carlos', 'García', 'gerente', 'activo'),
  ('gerente2@mundomotos.com', 'María', 'López', 'gerente', 'activo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO concesionarios (nombre, razon_social, nit, email, telefono, ciudad, departamento, direccion, latitud, longitud, gerente_id, estado)
SELECT 'Mundo Motos Bogotá', 'Mundo Motos S.A.S', '123456789', 'info@bogota.mundomotos.com', '+57 1 300 1234', 'Bogotá', 'Cundinamarca', 'Cra 7 #120-50', 4.7110, -74.0721, id, 'activo'
FROM users WHERE email = 'gerente1@mundomotos.com'
ON CONFLICT (nit) DO NOTHING;

INSERT INTO concesionarios (nombre, razon_social, nit, email, telefono, ciudad, departamento, direccion, latitud, longitud, gerente_id, estado)
SELECT 'Mundo Motos Medellín', 'Mundo Motos S.A.S', '123456790', 'info@medellin.mundomotos.com', '+57 4 444 5678', 'Medellín', 'Antioquia', 'Calle 30 #44-20', 6.2442, -75.5812, id, 'activo'
FROM users WHERE email = 'gerente2@mundomotos.com'
ON CONFLICT (nit) DO NOTHING;

INSERT INTO interacciones_crm (concesionario_id, tipo, detalles, usuario_responsable)
SELECT c.id, 'llamada', 'Llamada de seguimiento: el gerente confirmó inventario de modelos 2024.', u.id
FROM concesionarios c CROSS JOIN users u
WHERE c.nombre = 'Mundo Motos Bogotá' AND u.email = 'admin@mundomotos.com'
LIMIT 1;

INSERT INTO interacciones_crm (concesionario_id, tipo, detalles, usuario_responsable)
SELECT c.id, 'visita', 'Visita de auditoría: revisión de instalaciones y showroom.', u.id
FROM concesionarios c CROSS JOIN users u
WHERE c.nombre = 'Mundo Motos Medellín' AND u.email = 'admin@mundomotos.com'
LIMIT 1;
