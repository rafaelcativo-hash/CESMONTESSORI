-- =======================================================
-- 1. TABLA DE PERFILES (Datos base de autenticación)
-- =======================================================
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    rol TEXT CHECK (rol IN ('administrador', 'docente', 'estudiante')) DEFAULT 'estudiante',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =======================================================
-- 2. TABLA DE ESTUDIANTES (Base del Expediente)
-- =======================================================
-- Corregida: Usa perfil_id como Llave Primaria (UUID) para conectar directo con Auth
CREATE TABLE IF NOT EXISTS estudiantes (
    perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento DATE,
    nivel_montessori TEXT, -- Ejemplo: Casa de Niños, Taller I, Taller II
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =======================================================
-- 3. TABLA DE INSTRUMENTOS (Catálogo)
-- =======================================================
CREATE TABLE IF NOT EXISTS instrumentos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('principal', 'adicional')) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =======================================================
-- 4. TABLA DE MATRÍCULA DE INSTRUMENTOS (Relación del Expediente)
-- =======================================================
-- Corregida: estudiante_id hereda el UUID directamente de estudiantes(perfil_id)
CREATE TABLE IF NOT EXISTS matricula_instrumentos (
    id SERIAL PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(perfil_id) ON DELETE CASCADE,
    instrumento_id INT REFERENCES instrumentos(id) ON DELETE CASCADE,
    anio_lectivo INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    UNIQUE(estudiante_id, instrumento_id, anio_lectivo)
);

-- =======================================================
-- 5. TABLA DE CALIFICACIONES (Historial Académico)
-- =======================================================
-- Corregida: estudiante_id hereda el UUID directamente de estudiantes(perfil_id)
CREATE TABLE IF NOT EXISTS calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(perfil_id) ON DELETE CASCADE,
    materia_nombre TEXT NOT NULL,
    nota_final NUMERIC(5,2),
    nota_convocatoria NUMERIC(5,2) DEFAULT NULL,
    estado_materia TEXT CHECK (estado_materia IN ('Aprobado', 'Aplazado', 'Aprobado en Convocatoria', 'Reprobado')) DEFAULT 'Aplazado',
    anio_lectivo INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())
);

--- =======================================================
--- 🔒 ACTIVACIÓN DE SEGURIDAD (RLS)
--- =======================================================
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrumentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE matricula_instrumentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

--- =======================================================
--- 🔑 POLÍTICAS RLS PARA EL CORRECTO ACCESO DESDE LA APP
--- =======================================================

-- Políticas: PERFILES
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON perfiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON perfiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Políticas: ESTUDIANTES (Permite cargar expedientes)
CREATE POLICY "Estudiantes pueden ver sus propios datos" 
ON estudiantes FOR SELECT TO authenticated USING (auth.uid() = perfil_id);

CREATE POLICY "Docentes y Admins pueden ver y gestionar estudiantes" 
ON estudiantes FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);

-- Políticas: INSTRUMENTOS
CREATE POLICY "Todos los autenticados pueden ver los instrumentos" 
ON instrumentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo administradores gestionan el catálogo de instrumentos" 
ON instrumentos FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'administrador'
);

-- Políticas: MATRÍCULA DE INSTRUMENTOS
CREATE POLICY "Estudiantes ven sus propios instrumentos matriculados" 
ON matricula_instrumentos FOR SELECT TO authenticated USING (auth.uid() = estudiante_id);

CREATE POLICY "Docentes y Admins gestionan las matriculas" 
ON matricula_instrumentos FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);

-- Políticas: CALIFICACIONES
CREATE POLICY "Estudiantes ven sus propias calificaciones" 
ON calificaciones FOR SELECT TO authenticated USING (auth.uid() = estudiante_id);

CREATE POLICY "Docentes y Admins gestionan las calificaciones" 
ON calificaciones FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);
