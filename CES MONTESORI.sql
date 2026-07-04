--- =======================================================
--- 🔥 PASO 1: LIMPIEZA ABSOLUTA (Borrar lo arruinado)
--- =======================================================
DROP TABLE IF EXISTS calificaciones CASCADE;
DROP TABLE IF EXISTS matricula_materias_detalles CASCADE;
DROP TABLE IF EXISTS matriculas_globales CASCADE;
DROP TABLE IF EXISTS docente_niveles CASCADE;
DROP TABLE IF EXISTS estudiantes CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;

--- =======================================================
--- 🛠️ PASO 2: CREACIÓN DEL NUEVO ESQUELETO UNIFICADO
--- =======================================================

-- 1. TABLA DE PERFILES (Datos base de autenticación)
CREATE TABLE perfiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    rol TEXT CHECK (rol IN ('administrador', 'docente', 'estudiante')) DEFAULT 'estudiante',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABLA DE ESTUDIANTES (Expediente Base)
-- Usa el UUID como Primary Key para vincular directo con Auth y añade Docente a Cargo de forma independiente
CREATE TABLE estudiantes (
    perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento DATE,
    nivel_montessori TEXT, -- Ejemplo: Casa de Niños, Taller I, Taller II
    docente_cargo_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA CONFIGURATIVA: DOCENTES Y NIVELES MONTESSORI
-- Para definir administrativamente qué profesores cubren qué ambientes
CREATE TABLE docente_niveles (
    id SERIAL PRIMARY KEY,
    docente_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
    nivel_montessori TEXT NOT NULL, 
    anio_lectivo INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    UNIQUE(docente_id, nivel_montessori, anio_lectivo)
);

-- 4. TABLA PRINCIPAL DE MATRÍCULAS ADMINISTRATIVAS (El contrato anual)
CREATE TABLE matriculas_globales (
    id SERIAL PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(perfil_id) ON DELETE CASCADE, -- Referencia directa corregida
    anio_lectivo INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    fecha_matricula TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    estado_matricula TEXT CHECK (estado_matricula IN ('Activa', 'Inactiva', 'Retirado')) DEFAULT 'Activa',
    UNIQUE(estudiante_id, anio_lectivo)
);

-- 5. TABLA DETALLE: MATERIAS E INSTRUMENTOS INDIVIDUALES
-- Permite colgar materias o instrumentos de una en una dentro de la matrícula global
CREATE TABLE matricula_materias_detalles (
    id SERIAL PRIMARY KEY,
    matricula_global_id INT REFERENCES matriculas_globales(id) ON DELETE CASCADE,
    materia_nombre TEXT NOT NULL, 
    tipo_materia TEXT CHECK (tipo_materia IN ('principal', 'adicional', 'academica')) DEFAULT 'principal',
    fecha_adicion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(matricula_global_id, materia_nombre)
);

-- 6. TABLA DE CALIFICACIONES Y CONTROL DE CONVOCATORIAS
CREATE TABLE calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(perfil_id) ON DELETE CASCADE, -- Referencia directa corregida
    materia_nombre TEXT NOT NULL,
    nota_final NUMERIC(5,2),
    nota_convocatoria NUMERIC(5,2) DEFAULT NULL,
    estado_materia TEXT CHECK (estado_materia IN ('Aprobado', 'Aplazado', 'Aprobado en Convocatoria', 'Reprobado')) DEFAULT 'Aplazado',
    anio_lectivo INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())
);

--- =======================================================
--- 🔒 PASO 3: ENABLING ROW LEVEL SECURITY (RLS)
--- =======================================================
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE docente_niveles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas_globales ENABLE ROW LEVEL SECURITY;
ALTER TABLE matricula_materias_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

--- =======================================================
--- 🔑 PASO 4: POLÍTICAS DE SEGURIDAD PARA LA APP
--- =======================================================

-- Perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil" ON perfiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON perfiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Estudiantes
CREATE POLICY "Estudiantes pueden ver sus propios datos" ON estudiantes FOR SELECT TO authenticated USING (auth.uid() = perfil_id);
CREATE POLICY "Docentes y Admins gestionan expedientes" ON estudiantes FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador') OR auth.uid() = docente_cargo_id
);

-- Docente Niveles
CREATE POLICY "Todos pueden ver asignaciones de docentes" ON docente_niveles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admins configuran docentes por nivel" ON docente_niveles FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'administrador'
);

-- Matrículas Globales
CREATE POLICY "Docentes y Admins gestionan matriculas globales" ON matriculas_globales FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);
CREATE POLICY "Estudiantes ven su matricula global" ON matriculas_globales FOR SELECT TO authenticated USING (auth.uid() = estudiante_id);

-- Materias Detalles
CREATE POLICY "Docentes y Admins gestionan detalles de materias" ON matricula_materias_detalles FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);
CREATE POLICY "Estudiantes ven sus materias individuales" ON matricula_materias_detalles FOR SELECT TO authenticated USING (
  matricula_global_id IN (SELECT id FROM matriculas_globales WHERE estudiante_id = auth.uid())
);

-- Calificaciones
CREATE POLICY "Estudiantes ven sus propias calificaciones" ON calificaciones FOR SELECT TO authenticated USING (auth.uid() = estudiante_id);
CREATE POLICY "Docentes y Admins gestionan calificaciones" ON calificaciones FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);
