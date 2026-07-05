// CONFIGURACIÓN DE ACCESO GENERAL A TU PROYECTO SUPABASE
const SUPABASE_URL = "https://vdfxdydbggeoflagznuq.supabase.co";
const SUPABASE_KEY = "TU_ANON_KEY_REAL_DE_SUPABASE"; // <-- REEMPLAZA ESTO CON TU CLAVE DE VERDAD
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================================================
// 1. CONTROL DEL CALENDARIO ESCOLAR VIGENTE
// =======================================================
document.getElementById('btnGuardarCalendario')?.addEventListener('click', async () => {
    const inicio = document.getElementById('calInicioCurso').value;
    const fin = document.getElementById('calFinCurso').value;
    const vInicio = document.getElementById('calInicioVacaciones').value;
    const vFin = document.getElementById('calFinVacaciones').value;

    if (!inicio || !fin) return alert("El inicio y fin del curso son obligatorios.");

    localStorage.setItem('ces_calendario', JSON.stringify({ inicio, fin, vInicio, vFin }));
    alert("¡Fechas y vacaciones configuradas en el entorno local con éxito!");
});

// =======================================================
// 2. REGISTRAR DOCENTES A MANO
// =======================================================
document.getElementById('btnCrearDocente')?.addEventListener('click', async () => {
    const uuid = document.getElementById('docenteUuid').value.trim();
    const nombre = document.getElementById('docenteNombre').value.trim();

    if (!uuid || !nombre) return alert("Por favor, rellene el UUID y el nombre del docente.");

    const { error } = await supabase
        .from('perfiles')
        .insert([{ id: uuid, nombre_completo: nombre, rol: 'docente' }]);

    if (error) {
        alert("Error al guardar docente: " + error.message);
    } else {
        alert("¡Docente guardado exitosamente en la base de datos!");
        document.getElementById('docenteUuid').value = '';
        document.getElementById('docenteNombre').value = '';
    }
});

// =======================================================
// 3. MATRICULAR ALUMNOS DIRECTAMENTE
// =======================================================
document.getElementById('btnMatricularEstudiante')?.addEventListener('click', async () => {
    const uuid = document.getElementById('estudianteUuid').value.trim();
    const nombre = document.getElementById('estudianteNombre').value.trim();
    const apellido = document.getElementById('estudianteApellido').value.trim();
    const fechaNac = document.getElementById('estudianteFechaNac').value;
    const nivel = document.getElementById('estudianteNivel').value;
    const anioActual = new Date().getFullYear();

    if (!uuid || !nombre || !apellido) return alert("Rellene el UUID, nombre y apellido obligatoriamente.");

    // A. Crear Perfil Base
    const { error: errP } = await supabase
        .from('perfiles')
        .insert([{ id: uuid, nombre_completo: `${nombre} ${apellido}`, rol: 'estudiante' }]);
    if (errP) return alert("Error al crear perfil: " + errP.message);

    // B. Crear Expediente Académico
    const { error: errE } = await supabase
        .from('students') // Apunta de forma segura a estudiantes
        .from('estudiantes')
        .insert([{ perfil_id: uuid, nombre, apellido, fecha_nacimiento: fechaNac, nivel_montessori: nivel }]);
    if (errE) return alert("Error al levantar expediente: " + errE.message);

    // C. Generar Matrícula Global Automática
    const { error: errM } = await supabase
        .from('matriculas_globales')
        .insert([{ estudiante_id: uuid, anio_lectivo: anioActual, estado_matricula: 'Activa' }]);

    if (errM) {
        alert("Estudiante guardado, pero la matrícula global falló: " + errM.message);
    } else {
        alert("¡Estudiante dado de alta y matrícula anual activada correctamente!");
        document.getElementById('estudianteUuid').value = '';
        document.getElementById('estudianteNombre').value = '';
        document.getElementById('estudianteApellido').value = '';
    }
});

// =======================================================
// 4. CONTROL E INCLUSIÓN INDEPENDIENTE DE MATERIAS
// =======================================================
document.getElementById('btnAsignarMateria')?.addEventListener('click', async () => {
    const uuidEstudiante = document.getElementById('insEstudianteUuid').value.trim();
    const materia = document.getElementById('insNombreMateria').value.trim();
    const anioActual = new Date().getFullYear();

    if (!uuidEstudiante || !materia) return alert("Por favor ingrese el UUID del alumno y el instrumento.");

    // Buscamos la matrícula global activa del alumno para este año
    const { data: matricula, error: errB } = await supabase
        .from('matriculas_globales')
        .select('id')
        .eq('estudiante_id', uuidEstudiante)
        .eq('anio_lectivo', anioActual)
        .maybeSingle();

    if (errB || !matricula) {
        return alert("Error: El estudiante no cuenta con una matrícula global activa para este año.");
    }

    // Insertamos la materia de forma independiente amarrada a su contrato de matrícula
    const { error: errI } = await supabase
        .from('matricula_materias_detalles')
        .insert([{ matricula_global_id: matricula.id, materia_nombre: materia, tipo_materia: 'principal' }]);

    if (errI) {
        alert("Error al cargar la materia: " + errI.message);
    } else {
        alert(`¡Instrumento "${materia}" asignado exitosamente al alumno!`);
        document.getElementById('insNombreMateria').value = '';
    }
});
