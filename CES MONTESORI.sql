-- 1. TABLA DE PERFILES (Para guardar datos adicionales de los usuarios)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    rol TEXT CHECK (rol IN ('administrador', 'docente', 'estudiante')) DEFAULT 'estudiante',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABLA DE ESTUDIANTES
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento DATE,
    nivel_montessori TEXT, -- Ejemplo: Casa de Niños, Taller I, Taller II
    perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL
);

-- Habilitar la seguridad de nivel de fila (RLS) por seguridad institucional
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
  
