-- =======================================================
-- 1. TABLA PRINCIPAL: MATRÍCULAS ASES
-- (El registro global del estudiante para el año)
-- =======================================================
CREATE TABLE IF NOT EXISTS matriculas_globales (
    id SERIAL PRIMARY KEY,
    estudiante_id UUID REFERENCES estudiantes(perfil_id) ON DELETE CASCADE,
    anio_lectivo INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    fecha_matricula TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    estado_matricula TEXT CHECK (estado_matricula IN ('Activa', 'Inactiva', 'Retirado')) DEFAULT 'Activa',
    UNIQUE(estudiante_id, anio_lectivo) -- Un estudiante solo tiene una matrícula global por año
);

-- =======================================================
-- 2. TABLA DETALLE: MATERIAS INDIVIDUALES POR MATRÍCULA
-- (Aquí agregas de forma independiente cada materia/instrumento a esa matrícula)
-- =======================================================
CREATE TABLE IF NOT EXISTS matricula_materias_detalles (
    id SERIAL PRIMARY KEY,
    matricula_global_id INT REFERENCES matriculas_globales(id) ON DELETE CASCADE,
    materia_nombre TEXT NOT NULL, -- Ej: 'Piano', 'Flauta', 'Matemáticas', etc.
    tipo_materia TEXT CHECK (tipo_materia IN ('principal', 'adicional', 'academica')) DEFAULT 'principal',
    fecha_adicion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(matricula_global_id, materia_nombre) -- No duplicar la misma materia en la misma matrícula
);

--- =======================================================
--- 🔒 ACTIVAR SEGURIDAD (RLS)
--- =======================================================
ALTER TABLE matriculas_globales ENABLE ROW LEVEL SECURITY;
ALTER TABLE matricula_materias_detalles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Docentes y Admins gestionan matriculas globales" 
ON matriculas_globales FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);

CREATE POLICY "Docentes y Admins gestionan detalles de materias" 
ON matricula_materias_detalles FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('docente', 'administrador')
);

CREATE POLICY "Estudiantes ven sus propias materias" 
ON matricula_materias_detalles FOR SELECT TO authenticated USING (
  matricula_global_id IN (
    SELECT id FROM matriculas_globales WHERE estudiante_id = auth.uid()
  )
);
