-- Añadir la columna de docente a cargo a la tabla de estudiantes
ALTER TABLE estudiantes 
ADD COLUMN IF NOT EXISTS docente_cargo_id UUID REFERENCES perfiles(id) ON DELETE SET NULL;

-- Actualizar la política de estudiantes para asegurarnos de que el docente asignado 
-- también tenga permisos completos para ver el expediente de su alumno.
DROP POLICY IF EXISTS "Docentes y Admins pueden ver y gestionar estudiantes" ON estudiantes;

CREATE POLICY "Docentes y Admins pueden ver y gestionar estudiantes" 
ON estudiantes FOR ALL TO authenticated USING (
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'administrador' OR
  (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'docente' OR
  auth.uid() = docente_cargo_id
);
