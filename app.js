// =======================================================
// 🔗 CONFIGURACIÓN DE CONEXIÓN CON SUPABASE
// =======================================================
const SUPABASE_URL = "https://vdfxdydbggeoflagznuq.supabase.co";

// ⚠️ IMPORTANTE: Reemplaza las XXXXX de abajo con tu clave "anon public" real de Supabase
const SUPABASE_KEY = "XXXXXXXXXXXXX_TU_CLAVE_ANON_PUBLIC_REAL_XXXXXXXXXXXXX"; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================================================
// 1. CONTROL DEL CALENDARIO ESCOLAR (VIGENTE EN ENTORNO LOCAL)
// =======================================================
document.getElementById('btnGuardarCalendario')?.addEventListener('click', () => {
    const inicio = document.getElementById('calInicioCurso').value;
    const fin = document.getElementById('calFinCurso').value;
    const vInicio = document.getElementById('calInicioVacaciones').value;
    const vFin = document.getElementById('calFinVacaciones').value;

    if (!inicio || !fin) return alert("Por favor, establezca al menos el inicio y la finalización del curso.");

    localStorage.setItem('ces_calendario', JSON.stringify({ inicio, fin, vInicio, vFin }));
    alert("¡Fechas del curso y periodos de vacaciones guardados con éxito!");
});

// =======================================================
// 2. REGISTRAR DOCENTES A MANO
// =======================================================
document.getElementById('btnCrearDocente')?.addEventListener('click', async () => {
    const uuid = document.getElementById('docenteUuid').value.trim();
    const nombre = document.getElementById('docenteNombre').value.trim();

    if (!uuid || !nombre) return alert("Por favor, rellene el UUID y el nombre completo del docente.");

    const { error } = await supabase
        .from('perfiles')
        .insert([{ id: uuid, nombre_completo: nombre, rol: 'docente' }]);

    if (error) {
        alert("Error al registrar docente: " + error.message);
    } else {
        alert("¡Docente incluido exitosamente en el sistema!");
        document.getElementById('docenteUuid').value = '';
        document.getElementById('docenteNombre').value = '';
    }
});

// =======================================================
// 3. MATRICULAR ESTUDIANTES DIRECTAMENTE (ALTA GLOBAL)
// =======================================================
document.getElementById('btnMatricularEstudiante')?.addEventListener('click', async () => {
    const uuid = document.getElementById('estudianteUuid').value.trim();
    const nombre = document.getElementById('estudianteNombre').value.trim();
    const apellido = document.getElementById('estudianteApellido').value.trim();
    const fechaNac = document.getElementById('estudianteFechaNac').value;
    const nivel = document.getElementById('estudianteNivel').value;
    const anioActual = new Date().getFullYear();

    if (!uuid || !nombre || !apellido) return alert("El UUID, nombre y apellido son campos obligatorios.");

    // A. Crear perfil de usuario base
    const { error: errP } = await supabase
        .from('perfiles')
        .insert([{ id: uuid, nombre_completo: `${nombre} ${apellido}`, rol: 'estudiante' }]);
    
    if (errP) return alert("Error al crear el perfil base: " + errP.message);

    // B. Crear expediente en la tabla de estudiantes
    const { error: errE } = await supabase
        .from('estudiantes')
        .insert([{ perfil_id: uuid, nombre: nombre, apellido: apellido, fecha_nacimiento: fechaNac, nivel_montessori: nivel }]);
    
    if (errE) return alert("Error al levantar el expediente académico: " + errE.message);

    // C. Generar la matrícula anual obligatoria de forma automática
    const { error: errM } = await supabase
        .from('matriculas_globales')
        .insert([{ estudiante_id: uuid, anio_lectivo: anioActual, estado_matricula: 'Activa' }]);

    if (errM) {
        alert("Estudiante guardado, pero no se pudo activar la matrícula global: " + errM.message);
    } else {
        alert("¡Estudiante dado de alta y matrícula anual activada correctamente!");
        document.getElementById('estudianteUuid').value = '';
        document.getElementById('estudianteNombre').value = '';
        document.getElementById('estudianteApellido').value = '';
        document.getElementById('estudianteFechaNac').value = '';
    }
});

// =======================================================
// 4. CONTROL E INCLUSIÓN INDEPENDIENTE DE MATERIAS / INSTRUMENTOS
// =======================================================
document.getElementById('btnAsignarMateria')?.addEventListener('click', async () => {
    const uuidEstudiante = document.getElementById('insEstudianteUuid').value.trim();
    const materia = document.getElementById('insNombreMateria').value.trim();
    const anioActual = new Date().getFullYear();

    if (!uuidEstudiante || !materia) return alert("Debe ingresar tanto el UUID del alumno como el nombre del instrumento.");

    // Buscamos si el alumno tiene un contrato de matrícula global activo para este año
    const { data: matricula, error: errB } = await supabase
        .from('matriculas_globales')
        .select('id')
        .eq('estudiante_id', uuidEstudiante)
        .eq('anio_lectivo', anioActual)
        .maybeSingle();

    if (errB || !matricula) {
        return alert("Error: El estudiante especificado no posee una matrícula global activa para este ciclo lectivo.");
    }

    // Insertamos la materia ligada al ID de su matrícula global
    const { error: errI } = await supabase
        .from('matricula_materias_detalles')
        .insert([{ matricula_global_id: matricula.id, materia_nombre: materia, tipo_materia: 'principal' }]);

    if (errI) {
        alert("Error al asignar el instrumento: " + errI.message);
    } else {
        alert(`¡Instrumento "${materia}" cargado exitosamente en el expediente del alumno!`);
        document.getElementById('insNombreMateria').value = '';
    }
});
