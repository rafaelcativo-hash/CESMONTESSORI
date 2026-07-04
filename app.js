// CONFIGURACIÓN DE SUPABASE (Reemplaza con tus credenciales reales)
const SUPABASE_URL = "https://tu-proyecto-id.supabase.co";
const SUPABASE_KEY = "tu-anon-public-key-de-supabase";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioActual = null;
let esDocente = false;

// 1. CONTROL DE ACCESO (LOGIN)
async function iniciarSesion() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert("Por favor, rellene todos los campos.");
        return;
    }

    // Autenticación con Supabase Auth
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Error de ingreso: " + error.message);
        return;
    }

    usuarioActual = data.user;
    
    // Filtro básico: Si el correo contiene la palabra "docente", entra como profesor. Si no, como padre.
    esDocente = email.includes('docente');

    mostrarPanelPrincipal();
}

function mostrarPanelPrincipal() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-display').innerText = usuarioActual.email;

    if (esDocente) {
        document.getElementById('role-indicator').innerText = "Módulo de Gestión Docente";
        document.getElementById('view-docente').classList.remove('hidden');
        inicializarPanelDocente();
    } else {
        document.getElementById('role-indicator').innerText = "Módulo de Consulta para Padres de Familia";
        document.getElementById('view-padre').classList.remove('hidden');
        cargarDatosPadre();
    }
}

async function cerrarSesion() {
    await _supabase.auth.signOut();
    location.reload();
}

// 2. LÓGICA COMPLETA DEL DOCENTE
async function inicializarPanelDocente() {
    // Cargar la lista de materias desde la base de datos en línea
    const { data: materias, error } = await _supabase.from('materias').select('*');
    if (error) {
        console.error("Error al cargar materias:", error);
        return;
    }
    
    const selectMateria = document.getElementById('select-materia');
    selectMateria.innerHTML = materias.map(m => `<option value="${m.id}">${m.nombre_materia}</option>`).join('');
    
    cargarPlanillaDocente();
}

async function cargarPlanillaDocente() {
    const materiaId = document.getElementById('select-materia').value;
    const periodo = document.getElementById('select-periodo').value;
    if (!materiaId) return;

    // Obtener todos los alumnos registrados
    const { data: alumnos } = await _supabase.from('alumnos').select('*');
    
    // Obtener las notas ya existentes en la nube para esta materia y periodo
    const { data: notas } = await _supabase.from('calificaciones')
        .select('*')
        .eq('materia_id', materiaId)
        .eq('periodo', periodo);

    const tbody = document.getElementById('tabla-docente-body');
    tbody.innerHTML = '';

    alumnos.forEach(alumno => {
        // Buscar si el alumno ya tiene un registro guardado en la nube
        const registroNota = notas.find(n => n.alumno_id === alumno.id) || { nota: '', comentario: '' };

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-4 border-b border-gray-100 font-medium text-gray-700">${alumno.apellido}, ${alumno.nombre}</td>
            <td class="p-4 border-b border-gray-100">
                <input type="number" id="nota-${alumno.id}" class="w-full p-2 border rounded-lg text-center font-semibold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" min="0" max="100" value="${registroNota.nota !== null ? registroNota.nota : ''}">
            </td>
            <td class="p-4 border-b border-gray-100">
                <textarea id="com-${alumno.id}" class="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" rows="1" placeholder="Observaciones sobre rendimiento o actitud...">${registroNota.comentario || ''}</textarea>
            </td>
            <td class="p-4 border-b border-gray-100 text-center">
                <button onclick="guardarCalificacion(${alumno.id})" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">
                    Sincronizar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function guardarCalificacion(alumnoId) {
    const materiaId = document.getElementById('select-materia').value;
    const periodo = document.getElementById('select-periodo').value;
    const notaValue = document.getElementById(`nota-${alumnoId}`).value;
    const comentario = document.getElementById(`com-${alumnoId}`).value;

    // 'upsert' guarda la nota si es nueva, o la sobreescribe si ya existía en la nube
    const { error } = await _supabase.from('calificaciones').upsert({
        alumno_id: alumnoId,
        materia_id: materiaId,
        periodo: periodo,
        nota: notaValue ? parseFloat(notaValue) : null,
        comentario: comentario
    }, { onConflict: 'alumno_id,materia_id,periodo' });

    if (error) {
        alert("Error al sincronizar en la nube: " + error.message);
    } else {
        console.log(`Registro del alumno ${alumnoId} actualizado en la nube con éxito.`);
    }
}

// 3. LÓGICA DEL PADRE DE FAMILIA (FILTRADO SEGURO)
async function cargarDatosPadre() {
    const emailPadre = usuarioActual.email;

    // 1. Buscar qué alumnos están vinculados con el correo de este padre
    const { data: hijos, error: errHijos } = await _supabase
        .from('padres_hijos')
        .select('alumno_id, alumnos(nombre, apellido)')
        .eq('email_padre', emailPadre);

    const tbody = document.getElementById('tabla-padre-body');
    tbody.innerHTML = '';

    if (errHijos || !hijos || hijos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">No tiene estudiantes vinculados a su cuenta de correo.</td></tr>`;
        return;
    }

    const listaIdsHijos = hijos.map(h => h.alumno_id);

    // 2. Extraer las notas y comentarios exclusivamente de sus hijos
    const { data: calificaciones } = await _supabase
        .from('calificaciones')
        .select('nota, comentario, periodo, materias(nombre_materia)')
        .in('alumno_id', listaIdsHijos);

    if (!calificaciones || calificaciones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">Aún no se han publicado calificaciones registradas para este periodo.</td></tr>`;
        return;
    }

    calificaciones.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition";
        
        // Formato de alerta visual para notas bajas
        const notaColor = c.nota < 70 ? 'text-red-600 font-bold bg-red-50' : 'text-emerald-700 font-bold bg-emerald-50';

        tr.innerHTML = `
            <td class="p-4 border-b font-semibold text-gray-700">${c.materias.nombre_materia}</td>
            <td class="p-4 border-b text-gray-600">${c.periodo}</td>
            <td class="p-4 border-b text-center ${notaColor} rounded-md">${c.nota !== null ? c.nota : 'Pendiente'}</td>
            <td class="p-4 border-b text-gray-600 italic bg-gray-50/50">${c.comentario ? c.comentario : 'Sin observaciones registradas.'}</td>
        `;
        tbody.appendChild(tr);
    });
}