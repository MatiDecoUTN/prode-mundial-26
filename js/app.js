// js/app.js

let currentUser = null;

async function handleLogin() {
  const userInp = document.getElementById('inp-user').value.trim();
  const passInp = document.getElementById('inp-pass').value.trim();
  const errorMsg = document.getElementById('login-error');
  const btnLogin = document.getElementById('btn-login');

  if (!userInp || !passInp) {
    showError("Completá todos los campos");
    return;
  }

  // Estado de carga
  btnLogin.innerText = "Validando...";
  btnLogin.disabled = true;
  errorMsg.classList.add('hidden');

  try {
    // Llamada al backend
    const userData = await apiCall('login', { username: userInp, password: passInp });
    
    currentUser = userData; 
    
    // NUEVO: Guardamos la sesión en el almacenamiento local del navegador
    localStorage.setItem('prode_sesion', JSON.stringify(currentUser));
    
    document.getElementById('screen-login').classList.remove('active');
    
    // Iniciamos la descarga de los partidos
    await fetchAppDatos();

  } catch (err) {
    showError(err.message);
  } finally {
    btnLogin.innerText = "Entrar al Prode";
    btnLogin.disabled = false;
  }
}

function showError(msg) {
  const errorMsg = document.getElementById('login-error');
  errorMsg.innerText = msg;
  errorMsg.classList.remove('hidden');
}

function logout() {
  currentUser = null;
  
  // NUEVO: Borramos la sesión de la memoria
  localStorage.removeItem('prode_sesion');
  
  // Limpiamos los datos locales por seguridad
  appData = { partidos: [], misPronosticos: {}, ranking: [], fases: {}, jugadores: [], pronosticosOtros: {} };
  
  document.getElementById('inp-pass').value = '';
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-admin').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
}

// NUEVA FUNCIÓN: Se ejecuta automáticamente al recargar la página
window.onload = function() {
  const sesionGuardada = localStorage.getItem('prode_sesion');
  
  if (sesionGuardada) {
    // Si hay una sesión activa en memoria, la cargamos y saltamos el login
    currentUser = JSON.parse(sesionGuardada);
    document.getElementById('screen-login').classList.remove('active');
    fetchAppDatos();
  } else {
    // Si es la primera vez o cerró sesión, le mostramos el login normal
    document.getElementById('screen-login').classList.add('active');
  }
};

// js/app.js (al final del archivo)

function showTab(tabId, btnElement) {
  // 1. Ocultamos todos los contenidos de las pestañas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 2. Desmarcamos todos los botones del menú
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 3. Activamos solo la pestaña y el botón que clickeamos
  document.getElementById(tabId).classList.add('active');
  btnElement.classList.add('active');
  // Cerramos el menú dropdown si está abierto en el celular
  const menu = document.getElementById('menu-tabs');
  if (menu && menu.classList.contains('open')) {
    menu.classList.remove('open');
  }
}

// js/app.js (agregalo al final)

function showAdminTab(tabId, btnElement) {
  // 1. Buscamos y ocultamos solo las pestañas dentro del panel de admin
  const adminScreen = document.getElementById('screen-admin');
  
  adminScreen.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 2. Desmarcamos los botones del menú de admin
  adminScreen.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 3. Activamos la pestaña y el botón clickeado
  document.getElementById(tabId).classList.add('active');
  btnElement.classList.add('active');
}


// Variable global para guardar los datos del torneo
let appData = { partidos: [] };

const rondasFase2 = [
  { id: 'f16', nombre: "16avos de Final", min: 73, max: 88 },
  { id: 'f8', nombre: "Octavos de Final", min: 89, max: 96 },
  { id: 'f4', nombre: "Cuartos de Final", min: 97, max: 100 },
  { id: 'semi', nombre: "Semifinales", min: 101, max: 102 },
  { id: 'final', nombre: "Tercer Puesto y Final", min: 103, max: 104 }
];

// Reemplazá tu función fetchAppDatos por esta:
async function fetchAppDatos() {
  const loading = document.getElementById('loading-overlay');
  loading.classList.remove('hidden');
  try {
    // ... dentro de fetchAppDatos() ...
    const data = await apiCall('getDatos', { username: currentUser.username });
    appData.partidos = data.partidos;
    appData.misPronosticos = data.misPronosticos || {};
    appData.ranking = data.ranking || []; 
    appData.fases = data.fases || {};
    appData.jugadores = data.jugadores || []; // <-- AGREGAMOS ESTA LÍNEA
    appData.pronosticosOtros = data.pronosticosOtros || {};
    // Dentro del try de fetchAppDatos(), abajo de appData.pronosticosOtros = ...
    appData.misExtras = data.misExtras || {};
    appData.extrasComunidad = data.extrasComunidad || [];
    appData.resultadosExtras = data.resultadosExtras || {};
    
    if (currentUser.rol === 'admin') {
      document.getElementById('screen-admin').classList.add('active');
      renderAdminResultados();
      renderAdminJugadores(); // <-- AGREGAMOS ESTA FUNCIÓN
      
      ['grupos', 'f16', 'f8', 'f4', 'semi', 'final'].forEach(f => {
        document.getElementById(`toggle-${f}`).checked = appData.fases[f];
        document.getElementById(`label-${f}`).innerText = appData.fases[f] ? "Abierta" : "Cerrada";
      });
    } else {
      // Lógica de usuario común...
      document.getElementById('screen-app').classList.add('active');
      document.getElementById('nav-username').innerText = currentUser.username;
      renderMisPronosticos(); renderResultadosOficiales(); renderRankingGeneral();
      renderPremiosRandom(); // <-- Sumar esta línea
      renderSimuladorInit();
      iniciarContadorRegresivo();
    }
  } catch (err) { alert("Error: " + err.message); } finally { loading.classList.add('hidden'); }
}
// NUEVO DICCIONARIO: Ahora usamos los códigos ISO oficiales de 2 letras
const banderas = {
  // Los que ya tenías
  "Argentina": "ar", "México": "mx", "Estados Unidos": "us", "Canadá": "ca",
  "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz", "República Checa": "cz", "Republica Checa": "cz",
  "Bosnia y Herz.": "ba", "Qatar": "qa", "Suiza": "ch", "Brasil": "br", "Marruecos": "ma",
  "Haití": "ht", "Escocia": "gb-sct", "Paraguay": "py", "Australia": "au", "Turquía": "tr",
  "Alemania": "de", "Curazao": "cw", "Costa de Marfil": "ci", "Ecuador": "ec",
  "Austria": "at", "Jordania": "jo", "Argelia": "dz", "Portugal": "pt", "Colombia": "co",
  "Uzbekistán": "uz", "DR Congo": "cd", "Inglaterra": "gb-eng", "Croacia": "hr",
  "Ghana": "gh", "Panamá": "pa",
  
  // Agregados extra (Grupos F, G, H, I y potencias/frecuentes)
  "España": "es", "Francia": "fr", "Italia": "it", "Países Bajos": "nl", "Holanda": "nl",
  "Bélgica": "be", "Uruguay": "uy", "Chile": "cl", "Perú": "pe", "Venezuela": "ve",
  "Bolivia": "bo", "Japón": "jp", "Arabia Saudita": "sa", "Senegal": "sn", "Camerún": "cm",
  "Serbia": "rs", "Dinamarca": "dk", "Suecia": "se", "Polonia": "pl", "Gales": "gb-wls",
  "Irán": "ir", "Túnez": "tn", "Nigeria": "ng", "Mali": "ml", "Egipto": "eg",
  "Costa Rica": "cr", "Honduras": "hn", "El Salvador": "sv", "Jamaica": "jm", "Irak": "iq",
  "Emiratos Árabes": "ae", "Grecia": "gr", "Rumania": "ro", "Ucrania": "ua",
  "Noruega": "no",
  "Iraq": "iq",
  "Cabo Verde": "cv",
  "Nueva Zelanda": "nz",
};

// NUEVA FUNCIÓN: Devuelve una etiqueta de imagen (<img>) en lugar del emoji
function getBandera(pais) {
  const codigo = banderas[pais.trim()];
  if (codigo) {
    // Usamos FlagCDN para traer la imagen en tamaño 24x18 píxeles
    return `<img src="https://flagcdn.com/24x18/${codigo}.png" width="24" height="18" alt="${pais}">`;
  }
  // Si no encuentra el país en el diccionario, pone una banderita blanca de fallback
  return "🏳️"; 
}

// Función para unificar el formato del encabezado: Partido • Fecha y Hora • Lugar
function generarEncabezadoPartido(p) {
  // Expresión regular para dividir la sede y la hora por 2 o más espacios consecutivos
  const partesInfo = p.info ? p.info.split(/ {2,}/) : [];
  
  const lugar = partesInfo[0] ? partesInfo[0].trim() : (p.info || 'Sede no definida');
  const hora = partesInfo[1] ? partesInfo[1].trim() : '';

  // Armamos la cadena final según tengamos o no la hora parseada
  if (hora) {
    return `Partido ${p.id} • ${p.fecha} - ${hora} hs • ${lugar}`;
  } else {
    return `Partido ${p.id} • ${p.fecha} • ${lugar}`;
  }
}


function renderMisPronosticos() {
  const container = document.getElementById('prode-container');
  container.innerHTML = `
    <div class="sub-tabs-container">
      <button class="sub-tab active" onclick="showSubTab('prode', 'grupos', this)">Fase de Grupos</button>
      <button class="sub-tab" onclick="showSubTab('prode', 'elims', this)">Eliminatorias</button>
    </div>
    <div id="sub-prode-grupos" class="sub-content active"></div>
    <div id="sub-prode-elims" class="sub-content"></div>
  `;
  const contGrupos = document.getElementById('sub-prode-grupos');
  const contElims = document.getElementById('sub-prode-elims');

  for (let i = 0; i < 12; i++) {
    const letraGrupo = String.fromCharCode(65 + i);
    const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
    if (partidosGrupo.length === 0) continue;
    const title = document.createElement('h3'); title.className = 'group-title'; title.innerText = `Grupo ${letraGrupo}`;
    contGrupos.appendChild(title);
    partidosGrupo.forEach(p => {
      const card = document.createElement('div'); card.className = 'match-card';
      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local} <span class="flag">${getBandera(p.local)}</span></div>
          <div class="score-inputs">
            <input type="number" min="0" class="inp-score" id="gL_${p.id}" value="${appData.misPronosticos[p.id] ? appData.misPronosticos[p.id].gL : ''}" oninput="actualizarTablas()" ${!appData.fases.grupos ? 'disabled' : ''}>
            <span class="vs">VS</span>
            <input type="number" min="0" class="inp-score" id="gV_${p.id}" value="${appData.misPronosticos[p.id] ? appData.misPronosticos[p.id].gV : ''}" oninput="actualizarTablas()" ${!appData.fases.grupos ? 'disabled' : ''}>
          </div>
          <div class="team visitante"><span class="flag">${getBandera(p.visitante)}</span> ${p.visitante}</div>
        </div>`;
      contGrupos.appendChild(card);
    });
    const tableDiv = document.createElement('div'); tableDiv.id = `tabla-grupo-${letraGrupo}`; contGrupos.appendChild(tableDiv);
  }

  rondasFase2.forEach(ronda => {
    const partidosRonda = appData.partidos.filter(p => p.id >= ronda.min && p.id <= ronda.max);
    if (partidosRonda.length === 0) return; 
    const title = document.createElement('h3'); title.className = 'group-title'; title.style.backgroundColor = "#8e44ad"; title.innerText = ronda.nombre;
    contElims.appendChild(title);
    partidosRonda.forEach(p => {
      const card = document.createElement('div'); card.className = 'match-card';
      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local}</div>
          <div class="score-inputs">
            <input type="number" min="0" class="inp-score" id="gL_${p.id}" value="${appData.misPronosticos[p.id] ? appData.misPronosticos[p.id].gL : ''}" ${!appData.fases[ronda.id] ? 'disabled' : ''}>
            <span class="vs">VS</span>
            <input type="number" min="0" class="inp-score" id="gV_${p.id}" value="${appData.misPronosticos[p.id] ? appData.misPronosticos[p.id].gV : ''}" ${!appData.fases[ronda.id] ? 'disabled' : ''}>
          </div>
          <div class="team visitante">${p.visitante}</div>
        </div>`;
      contElims.appendChild(card);
    });
  });

  const btnContainer = document.getElementById('btn-save-container');
  // Se muestra guardar siempre y cuando haya al menos 1 fase abierta
  if(Object.values(appData.fases).some(estado => estado === true)) {
    btnContainer.classList.remove('hidden');
    document.getElementById('prode-phase-msg').innerHTML = '';
  } else {
    btnContainer.classList.add('hidden');
    document.getElementById('prode-phase-msg').innerHTML = '<div class="error-msg">🔒 Todas las rondas están cerradas.</div>';
  }
  actualizarTablas();
}


// NUEVA FUNCIÓN: Calcula y dibuja las tablas en tiempo real
function actualizarTablas() {
  for (let i = 0; i < 12; i++) {
    const letraGrupo = String.fromCharCode(65 + i);
    const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
    if (partidosGrupo.length === 0) continue;

    let stats = {};
    partidosGrupo.forEach(p => {
      if (p.local && !stats[p.local]) stats[p.local] = { nombre: p.local, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, df: 0 };
      if (p.visitante && !stats[p.visitante]) stats[p.visitante] = { nombre: p.visitante, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, df: 0 };
    });

    partidosGrupo.forEach(p => {
      // Leemos lo que tipeó el usuario en los inputs de la pantalla
      let gL = document.getElementById(`gL_${p.id}`) ? document.getElementById(`gL_${p.id}`).value : "";
      let gV = document.getElementById(`gV_${p.id}`) ? document.getElementById(`gV_${p.id}`).value : "";

      if (gL !== "" && gV !== "") {
        gL = parseInt(gL); gV = parseInt(gV);
        stats[p.local].pj++; stats[p.visitante].pj++;
        stats[p.local].gf += gL; stats[p.local].gc += gV;
        stats[p.visitante].gf += gV; stats[p.visitante].gc += gL;
        
        if (gL > gV) { stats[p.local].pts += 3; stats[p.local].g++; stats[p.visitante].p++; }
        else if (gL < gV) { stats[p.visitante].pts += 3; stats[p.visitante].g++; stats[p.local].p++; }
        else { stats[p.local].pts += 1; stats[p.local].e++; stats[p.visitante].pts += 1; stats[p.visitante].e++; }
      }
    });

    let tabla = Object.values(stats);
    tabla.forEach(eq => eq.df = eq.gf - eq.gc);
    tabla.sort((a, b) => b.pts - a.pts || b.df - a.df || b.gf - a.gf);

    // ACÁ ESTABA EL POSIBLE ERROR: La declaración de la variable 'html'
    let html = `
      <div class="table-container" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
        <table class="standings-table">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th style="text-align: left;">Equipo</th>
              <th>Pts</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>GF</th>
              <th>GC</th>
              <th>DF</th>
            </tr>
          </thead>
          <tbody>
    `;

    tabla.forEach((eq, index) => {
      let claseClasificacion = index < 2 ? 'clasificado' : '';
      
      html += `
        <tr>
          <td style="font-weight: bold; color: #777; text-align: center;">${index + 1}</td>
          <td class="team-name ${claseClasificacion}" style="text-align: left; display: flex; align-items: center; gap: 6px;">
            <span class="flag">${getBandera(eq.nombre)}</span> ${eq.nombre}
          </td>
          <td class="col-pts" style="font-weight: bold; color: #2c3e50;">${eq.pts}</td>
          <td>${eq.pj}</td>
          <td>${eq.g || 0}</td>
          <td>${eq.e || 0}</td>
          <td>${eq.p || 0}</td>
          <td>${eq.gf || 0}</td>
          <td>${eq.gc || 0}</td>
          <td>${eq.df > 0 ? '+' + eq.df : eq.df}</td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    
    // Inyectamos el HTML en el div correspondiente
    const divTabla = document.getElementById(`tabla-grupo-${letraGrupo}`);
    if (divTabla) divTabla.innerHTML = html;
  }
}

function renderAdminResultados() {
  const container = document.getElementById('admin-resultados-container');
  container.innerHTML = ''; 
  
  // 1. DIBUJAMOS GRUPOS PARA EL ADMIN
  for (let i = 0; i < 12; i++) {
    const letraGrupo = String.fromCharCode(65 + i);
    const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
    if (partidosGrupo.length === 0) continue;

    const title = document.createElement('h3');
    title.className = 'group-title';
    title.innerText = `Grupo ${letraGrupo}`;
    container.appendChild(title);

    partidosGrupo.forEach(p => {
      const card = document.createElement('div');
      card.className = 'match-card';
      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local} <span class="flag">${getBandera(p.local)}</span></div>
          <div class="score-inputs">
            <input type="number" min="0" class="inp-score" id="admin_gL_${p.id}" value="${p.golesL !== null ? p.golesL : ''}" placeholder="-">
            <span class="vs">VS</span>
            <input type="number" min="0" class="inp-score" id="admin_gV_${p.id}" value="${p.golesV !== null ? p.golesV : ''}" placeholder="-">
          </div>
          <div class="team visitante"><span class="flag">${getBandera(p.visitante)}</span> ${p.visitante}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 2. DIBUJAMOS ELIMINATORIAS PARA EL ADMIN
  rondasFase2.forEach(ronda => {
    const partidosRonda = appData.partidos.filter(p => p.id >= ronda.min && p.id <= ronda.max);
    if (partidosRonda.length === 0) return;

    const title = document.createElement('h3');
    title.className = 'group-title';
    title.style.backgroundColor = "#8e44ad";
    title.innerText = ronda.nombre;
    container.appendChild(title);

    partidosRonda.forEach(p => {
      const card = document.createElement('div');
      card.className = 'match-card';
      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local} <span class="flag">${getBandera(p.local)}</span></div>
          <div class="score-inputs">
            <input type="number" min="0" class="inp-score" id="admin_gL_${p.id}" value="${p.golesL !== null ? p.golesL : ''}" placeholder="-">
            <span class="vs">VS</span>
            <input type="number" min="0" class="inp-score" id="admin_gV_${p.id}" value="${p.golesV !== null ? p.golesV : ''}" placeholder="-">
          </div>
          <div class="team visitante"><span class="flag">${getBandera(p.visitante)}</span> ${p.visitante}</div>
        </div>
      `;
      container.appendChild(card);
    });
  });
}


// js/app.js (Pegar al final)

async function savePronosticos() {
  const btn = document.querySelector('.btn-save');
  const statusSpan = document.getElementById('save-status');
  
  btn.innerText = "Guardando...";
  btn.disabled = true;
  statusSpan.innerText = "";
  statusSpan.className = "save-status"; // Resetea colores

  let pronosticosParaGuardar = [];

  // Recorremos los partidos para buscar qué escribió el usuario
  appData.partidos.forEach(p => {
    const inL = document.getElementById(`gL_${p.id}`);
    const inV = document.getElementById(`gV_${p.id}`);
    
    // Si ambos casilleros del partido tienen un número, lo guardamos
    if (inL && inV && inL.value !== "" && inV.value !== "") {
      pronosticosParaGuardar.push({
        id: p.id,
        golesL: parseInt(inL.value),
        golesV: parseInt(inV.value)
      });
    }
  });

  if (pronosticosParaGuardar.length === 0) {
    statusSpan.innerText = "⚠️ No hay resultados para guardar.";
    statusSpan.style.color = "#d93025";
    btn.innerText = "💾 Guardar mis pronósticos";
    btn.disabled = false;
    return;
  }

  try {
    // Mandamos el paquete al backend
    await apiCall('savePronosticos', { 
      username: currentUser.username, 
      pronosticos: pronosticosParaGuardar 
    });
    
    statusSpan.innerText = "✅ ¡Tus pronósticos se guardaron con éxito!";
    statusSpan.style.color = "#137333";
    
    // Borramos el mensaje después de 3 segundos
    setTimeout(() => { statusSpan.innerText = ""; }, 3000);
    
  } catch (err) {
    statusSpan.innerText = "❌ Error al guardar: " + err.message;
    statusSpan.style.color = "#d93025";
  } finally {
    btn.innerText = "💾 Guardar mis pronósticos";
    btn.disabled = false;
  }
}

function renderResultadosOficiales() {
  const container = document.getElementById('resultados-container');
  container.innerHTML = `
    <div class="sub-tabs-container">
      <button class="sub-tab active" onclick="showSubTab('resultados', 'grupos', this)">Fase de Grupos</button>
      <button class="sub-tab" onclick="showSubTab('resultados', 'elims', this)">Eliminatorias</button>
    </div>
    <div id="sub-resultados-grupos" class="sub-content active"></div>
    <div id="sub-resultados-elims" class="sub-content"></div>
  `;
  const contGrupos = document.getElementById('sub-resultados-grupos');
  const contElims = document.getElementById('sub-resultados-elims');
  let puntosTotalesJugador = 0;

  // --- 1. DIBUJAMOS LA FASE DE GRUPOS COLAPSABLE ---
  for (let i = 0; i < 12; i++) {
    const letraGrupo = String.fromCharCode(65 + i);
    const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
    if (partidosGrupo.length === 0) continue;

    // Obtenemos los equipos únicos de este grupo para listarlos en el botón
    let equiposGrupo = [];
    partidosGrupo.forEach(p => {
      if (p.local && !equiposGrupo.includes(p.local)) equiposGrupo.push(p.local);
      if (p.visitante && !equiposGrupo.includes(p.visitante)) equiposGrupo.push(p.visitante);
    });

    // NUEVO: Mapeamos los equipos para inyectarles su bandera al lado usando inline-flex
    const listaEquiposHTML = equiposGrupo.map(eq => {
      return `<span style="display: inline-flex; align-items: center; gap: 4px;">${getBandera(eq)} ${eq}</span>`;
    }).join('<span style="opacity: 0.4; margin: 0 4px;">·</span>');

    // Creamos la estructura del acordeón para el grupo entero
    const groupWrapper = document.createElement('div');
    groupWrapper.style.marginBottom = '20px';
    groupWrapper.innerHTML = `
      <button onclick="toggleGrupoContent('${letraGrupo}')" class="group-title" style="width: 100%; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 15px; cursor: pointer; border: none; border-radius: 8px; outline: none;">
        <span id="btn-text-grupo-${letraGrupo}" style="font-size: 1.1rem; font-weight: 800; letter-spacing: 1px;">GRUPO ${letraGrupo} ⬇️</span>
        <span style="font-size: 0.8rem; font-weight: 500; margin-top: 6px; opacity: 0.9; text-transform: none; letter-spacing: 0; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px;">
          ${listaEquiposHTML}
        </span>
      </button>
      <div id="content-grupo-${letraGrupo}" class="hidden" style="margin-top: 15px;"></div>
    `;
    
    contGrupos.appendChild(groupWrapper);
    const groupContentContainer = document.getElementById(`content-grupo-${letraGrupo}`);

    // Inyectamos los partidos adentro del bloque del grupo
    partidosGrupo.forEach(p => {
      let ptsGanados = 0; let tieneProde = appData.misPronosticos[p.id];
      if (p.golesL !== null && p.golesV !== null && tieneProde) { 
        ptsGanados = calcularPuntosEnFrente(tieneProde.gL, tieneProde.gV, p.golesL, p.golesV); 
        puntosTotalesJugador += ptsGanados; 
      }
      
      const card = document.createElement('div'); 
      card.className = `match-card ${p.golesL !== null ? 'partido-jugado' : ''}`;
      
      let htmlOthers = '';
      if (appData.fases[getFaseKeyDePartidoFrontend(p.id)] === false) {
         let chipsOthers = appData.jugadores
              .filter(j => j.rol !== 'admin' && j.usuario.toLowerCase() !== currentUser.username.toLowerCase())
              .map(j => {
                let op = appData.pronosticosOtros[p.id] ? appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === j.usuario.toLowerCase()) : null;
                if (op) {
                  return `<div class="other-user-chip"><span class="other-name">${j.usuario}:</span> <span class="other-score">${op.gL}-${op.gV}</span></div>`;
                } else {
                  return `<div class="other-user-chip missing"><span class="other-name">${j.usuario}:</span> <span class="other-score">Sin cargar</span></div>`;
                }
            }).join('');
            
         htmlOthers = `
            <button onclick="togglePronosticos(this, ${p.id})" style="background: #f1f3f4; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #555; cursor: pointer; margin-top: 5px; width: 100%; transition: background 0.2s;">
              👀 Ver pronósticos del grupo ⬇️
            </button>
            <div id="others-match-${p.id}" class="others-box hidden" style="margin-top: 8px;">
              <div class="others-grid">
                ${chipsOthers}
              </div>
            </div>
         `;
      }

      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local} <span class="flag">${getBandera(p.local)}</span></div>
          <div class="score-display">
            <span class="score-num">${p.golesL !== null ? p.golesL : '-'}</span>
            <span class="vs">:</span>
            <span class="score-num">${p.golesV !== null ? p.golesV : '-'}</span>
          </div>
          <div class="team visitante"><span class="flag">${getBandera(p.visitante)}</span> ${p.visitante}</div>
        </div>
        
        <div class="prediction-row-container" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eee;">
          ${tieneProde ? `
            <div style="font-size: 0.85rem; color: #555; text-align: center;">
              Tu prode: <strong>${tieneProde.gL}-${tieneProde.gV}</strong> | <span style="color: ${ptsGanados > 0 ? '#137333' : '#666'}; font-weight: 700;">+${ptsGanados} pts</span>
            </div>
          ` : `<div class="user-prediction-badge missing">No cargaste pronóstico</div>`}
          
          ${htmlOthers}
        </div>
      `;
      groupContentContainer.appendChild(card);
    });

    // Inyectamos la tabla de posiciones real abajo de los partidos del grupo
    const divTabla = document.createElement('div'); 
    divTabla.innerHTML = generarTablaRealHTML(partidosGrupo); 
    groupContentContainer.appendChild(divTabla);
  }

  // --- 2. DIBUJAMOS LAS ELIMINATORIAS ---
  rondasFase2.forEach(ronda => {
    const partidosRonda = appData.partidos.filter(p => p.id >= ronda.min && p.id <= ronda.max);
    if (partidosRonda.length === 0) return;
    const title = document.createElement('h3'); title.className = 'group-title'; title.style.backgroundColor = "#8e44ad"; title.innerText = ronda.nombre;
    contElims.appendChild(title);
    
    partidosRonda.forEach(p => {
      let ptsGanados = 0; let tieneProde = appData.misPronosticos[p.id];
      if (p.golesL !== null && p.golesV !== null && tieneProde) { ptsGanados = calcularPuntosEnFrente(tieneProde.gL, tieneProde.gV, p.golesL, p.golesV); puntosTotalesJugador += ptsGanados; }
      const card = document.createElement('div'); card.className = `match-card ${p.golesL !== null ? 'partido-jugado' : ''}`;
      
      let htmlOthers = '';
      if (appData.fases[getFaseKeyDePartidoFrontend(p.id)] === false) {
         let chipsOthers = appData.jugadores
              .filter(j => j.rol !== 'admin' && j.usuario.toLowerCase() !== currentUser.username.toLowerCase())
              .map(j => {
                let op = appData.pronosticosOtros[p.id] ? appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === j.usuario.toLowerCase()) : null;
                if (op) {
                  return `<div class="other-user-chip"><span class="other-name">${j.usuario}:</span> <span class="other-score">${op.gL}-${op.gV}</span></div>`;
                } else {
                  return `<div class="other-user-chip missing"><span class="other-name">${j.usuario}:</span> <span class="other-score">Sin cargar</span></div>`;
                }
            }).join('');
            
         htmlOthers = `
            <button onclick="togglePronosticos(this, ${p.id})" style="background: #f1f3f4; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #555; cursor: pointer; margin-top: 5px; width: 100%; transition: background 0.2s;">
              👀 Ver pronósticos del grupo ⬇️
            </button>
            <div id="others-match-${p.id}" class="others-box hidden" style="margin-top: 8px;">
              <div class="others-grid">
                ${chipsOthers}
              </div>
            </div>
         `;
      }

      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local} <span class="flag">${getBandera(p.local)}</span></div>
          <div class="score-display">
            <span class="score-num">${p.golesL !== null ? p.golesL : '-'}</span>
            <span class="vs">:</span>
            <span class="score-num">${p.golesV !== null ? p.golesV : '-'}</span>
          </div>
          <div class="team visitante"><span class="flag">${getBandera(p.visitante)}</span> ${p.visitante}</div>
        </div>
        
        <div class="prediction-row-container" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eee;">
          ${tieneProde ? `
            <div style="font-size: 0.85rem; color: #555; text-align: center;">
              Tu prode: <strong>${tieneProde.gL}-${tieneProde.gV}</strong> | <span style="color: ${ptsGanados > 0 ? '#137333' : '#666'}; font-weight: 700;">+${ptsGanados} pts</span>
            </div>
          ` : `<div class="user-prediction-badge missing">No cargaste pronóstico</div>`}
          
          ${htmlOthers}
        </div>
      `;
      contElims.appendChild(card);
    });
  });
  document.getElementById('prode-pts-badge').innerText = `🏆 Mis Puntos: ${puntosTotalesJugador} pts`;
}


// Variable global para recordar si el usuario prendió las flechitas
window.mostrarVariacionRanking = false; 

function actualizarToggleVariacion(isChecked) {
   window.mostrarVariacionRanking = isChecked;
   renderRankingGeneral();
}

// Función que calcula qué puesto tenía cada uno antes del último partido jugado
function getVariacionPosiciones() {
   const partidosJugados = appData.partidos.filter(p => p.golesL !== null && p.golesV !== null).sort((a, b) => a.id - b.id);
   let variaciones = {};
   let usuarios = appData.jugadores.filter(j => j.rol !== 'admin').map(j => j.usuario);

   // Si hay 1 o 0 partidos jugados, no hay variación posible todavía
   if (partidosJugados.length <= 1) {
      usuarios.forEach(u => variaciones[u] = 0);
      return variaciones;
   }

   let ptsPrevios = {};
   usuarios.forEach(u => ptsPrevios[u] = { pts: 0, exactos: 0 });

   // Calculamos el torneo frenando UN PARTIDO ANTES del final (length - 1)
   for(let i = 0; i < partidosJugados.length - 1; i++) {
      let p = partidosJugados[i];
      usuarios.forEach(u => {
         let uLower = u.toLowerCase();
         let op = null;
         if (uLower === currentUser.username.toLowerCase()) {
            op = appData.misPronosticos[p.id];
         } else if (appData.pronosticosOtros[p.id]) {
            op = appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === uLower);
         }
         if (op && op.gL !== "" && op.gV !== "") {
            let pts = calcularPuntosEnFrente(op.gL, op.gV, p.golesL, p.golesV);
            ptsPrevios[u].pts += pts;
            if (pts === 7) ptsPrevios[u].exactos += 1;
         }
      });
   }

   // Foto de las posiciones en el pasado
   let snapshotPrevio = usuarios.map(u => ({ usuario: u, pts: ptsPrevios[u].pts, exactos: ptsPrevios[u].exactos }));
   snapshotPrevio.sort((a, b) => b.pts - a.pts || b.exactos - a.exactos);
   let posicionesPrevias = {};
   snapshotPrevio.forEach((snap, idx) => posicionesPrevias[snap.usuario] = idx + 1);

   // Comparamos el pasado con la tabla real del presente
   appData.ranking.forEach((row, idx) => {
       let posActual = idx + 1;
       let posPrevia = posicionesPrevias[row.jugador] || posActual;
       variaciones[row.jugador] = posPrevia - posActual; // Ej: Si antes era 5° y ahora 3° -> 5 - 3 = +2 (Subió)
   });

   return variaciones;
}
    

// TAB: Ranking General (La tabla de posiciones de tus amigos)
function renderRankingGeneral() {
  const container = document.getElementById('ranking-container');
  if (!container) return;

  container.innerHTML = '';
  if (appData.ranking.length === 0) { 
    container.innerHTML = '<p style="text-align:center; padding: 20px;">El torneo no empezó o no hay puntos calculados.</p>'; 
    return; 
  }

  // Obtenemos las variaciones numéricas SOLO si el switch está prendido
  let variaciones = {};
  if (window.mostrarVariacionRanking) {
    variaciones = getVariacionPosiciones();
  }

  // Armamos el Toggle HTML bien bonito arriba de la tabla
  let html = `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 12px; margin-top: -10px;">
      <label style="font-size: 0.8rem; color: #555; display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 600; background: white; padding: 8px 15px; border-radius: 20px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s;">
        <input type="checkbox" style="cursor: pointer;" onchange="actualizarToggleVariacion(this.checked)" ${window.mostrarVariacionRanking ? 'checked' : ''}>
        📈 Mostrar variación vs. último partido
      </label>
    </div>
    <div class="ranking-hint">💡 Tocá a un jugador para ver su perfil. En caso de empate, define quien tenga más Plenos (7pts).</div>
    <div class="table-container">
      <table class="standings-table">
        <thead>
          <tr>
            <th style="width: 50px;">Pos</th>
            <th style="text-align: left;">Jugador</th>
            <th>Plenos</th>
            <th>Puntos</th>
          </tr>
        </thead>
        <tbody>`;

  appData.ranking.forEach((row, index) => {
    let medalla = index + 1;
    if (index === 0) medalla = "🥇"; if (index === 1) medalla = "🥈"; if (index === 2) medalla = "🥉";
    let esSocio = currentUser && row.jugador.toLowerCase() === currentUser.username.toLowerCase() ? 'highlight-user' : '';

    // Lógica para pintar la flecha verde, roja o la raya gris
    let badgeVariacion = '';
    if (window.mostrarVariacionRanking) {
       let diff = variaciones[row.jugador] || 0;
       if (diff > 0) {
           badgeVariacion = `<span style="color: #137333; font-size: 0.8rem; font-weight: 800; margin-left: 8px;" title="Subió ${diff} posiciones">▲ ${diff}</span>`;
       } else if (diff < 0) {
           badgeVariacion = `<span style="color: #d93025; font-size: 0.8rem; font-weight: 800; margin-left: 8px;" title="Bajó ${Math.abs(diff)} posiciones">▼ ${Math.abs(diff)}</span>`;
       } else {
           badgeVariacion = `<span style="color: #999; font-size: 0.8rem; font-weight: 800; margin-left: 8px;" title="Mantuvo su posición">➖</span>`;
       }
    }

    html += `
          <tr class="${esSocio} clickable-row" onclick="abrirPerfilJugador('${row.jugador}')">
            <td style="font-weight: 700;">${medalla}</td>
            <td class="team-name">${row.jugador} ${badgeVariacion}</td>
            <td style="color: #666; font-size: 0.9rem;">🎯 ${row.exactos || 0}</td>
            <td class="col-pts">${row.puntos} pts</td>
          </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;

  try {
    if (typeof Chart !== 'undefined') {
      renderGraficoEvolucion();
    } else {
      console.warn("Chart.js no está cargado. Revisá la etiqueta <script> en el HTML.");
    }
  } catch (e) {
    console.error("Error al dibujar el gráfico: ", e);
  }
}

// Función auxiliar en JS para pintar los puntos individuales por tarjeta
function calcularPuntosEnFrente(pL, pV, rL, rV) {
  pL = parseInt(pL); pV = parseInt(pV); rL = parseInt(rL); rV = parseInt(rV);
  if (pL === rL && pV === rV) return 7;
  let pts = 0;
  if (Math.sign(pL - pV) === Math.sign(rL - rV)) pts += 3;
  if (pL === rL) pts += 2;
  if (pV === rV) pts += 2;
  return pts;
}

async function saveResultados() {
  // Buscamos el botón dentro del panel de admin
  const btn = document.querySelector('#atab-resultados .btn-save');
  const statusSpan = document.getElementById('admin-save-status');
  
  btn.innerText = "Guardando...";
  btn.disabled = true;
  statusSpan.innerText = "";
  statusSpan.className = "save-status"; 

  let resultadosParaGuardar = [];

  // Buscamos todos los inputs que el admin haya llenado
  appData.partidos.forEach(p => {
    const inL = document.getElementById(`admin_gL_${p.id}`);
    const inV = document.getElementById(`admin_gV_${p.id}`);
    
    if (inL && inV && inL.value !== "" && inV.value !== "") {
      resultadosParaGuardar.push({
        id: p.id,
        golesL: parseInt(inL.value),
        golesV: parseInt(inV.value)
      });
    }
  });

  if (resultadosParaGuardar.length === 0) {
    statusSpan.innerText = "⚠️ No hay resultados para guardar.";
    statusSpan.style.color = "#d93025";
    btn.innerText = "💾 Guardar Resultados";
    btn.disabled = false;
    return;
  }

  try {
    await apiCall('saveResultados', { 
      username: currentUser.username, 
      resultados: resultadosParaGuardar 
    });
    
    statusSpan.innerText = "✅ ¡Resultados oficiales actualizados!";
    statusSpan.style.color = "#137333";
    setTimeout(() => { statusSpan.innerText = ""; }, 3000);
    
  } catch (err) {
    statusSpan.innerText = "❌ Error al guardar: " + err.message;
    statusSpan.style.color = "#d93025";
  } finally {
    btn.innerText = "💾 Guardar Resultados";
    btn.disabled = false;
  }
}

async function toggleFase(numFase, estado) {
  const label = document.getElementById(`label-${numFase}`);
  label.innerText = "Guardando...";
  try {
    await apiCall('toggleFase', { fase: numFase, estado: estado });
    label.innerText = estado ? "Abierta" : "Cerrada";
    appData.fases[numFase] = estado;
  } catch(e) {
    document.getElementById(`toggle-${numFase}`).checked = !estado;
    label.innerText = !estado ? "Abierta" : "Cerrada";
  }
}

// NUEVA FUNCIÓN: Genera la tabla de posiciones con los resultados de la vida real
function generarTablaRealHTML(partidosGrupo) {
  let stats = {};
  partidosGrupo.forEach(p => {
    if (p.local && !stats[p.local]) stats[p.local] = { nombre: p.local, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
    if (p.visitante && !stats[p.visitante]) stats[p.visitante] = { nombre: p.visitante, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
  });

  partidosGrupo.forEach(p => {
    if (p.golesL !== null && p.golesV !== null) {
      const gL = p.golesL; const gV = p.golesV;
      stats[p.local].pj++; stats[p.visitante].pj++;
      stats[p.local].gf += gL; stats[p.local].gc += gV;
      stats[p.visitante].gf += gV; stats[p.visitante].gc += gL;
      if (gL > gV) { stats[p.local].pts += 3; stats[p.local].g++; stats[p.visitante].p++; }
      else if (gL < gV) { stats[p.visitante].pts += 3; stats[p.visitante].g++; stats[p.local].p++; }
      else { stats[p.local].pts += 1; stats[p.local].e++; stats[p.visitante].pts += 1; stats[p.visitante].e++; }
    }
  });

  let tabla = Object.values(stats).sort((a, b) => b.pts - a.pts || (b.gf-b.gc) - (a.gf-a.gc) || b.gf - a.gf);
  const mejoresTerceros = calcularMejoresTercerosReales(); // <-- LLAMADA GLOBAL

  let html = `<div class="table-container" style="margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 15px;">
    <table class="standings-table">
      <thead><tr><th style="width:25px;">#</th><th style="text-align:left;">Equipo</th><th>Pts</th><th>PJ</th><th>DF</th></tr></thead>
      <tbody>`;
  
  tabla.forEach((eq, index) => {
    let claseClasificacion = '';
    if (index < 2) claseClasificacion = 'clasificado'; // Verde para el 1° y 2°
    else if (index === 2 && mejoresTerceros.includes(eq.nombre)) claseClasificacion = 'clasificado-tercero'; // Azul para el 3° que pasa

    html += `<tr>
      <td style="font-weight:bold; color:#777; text-align:center;">${index + 1}</td>
      <td class="team-name ${claseClasificacion}" style="text-align: left; display: flex; align-items: center; gap: 6px;">
        <span class="flag">${getBandera(eq.nombre)}</span> ${eq.nombre}
      </td>
      <td class="col-pts">${eq.pts}</td><td>${eq.pj}</td><td>${eq.gf - eq.gc}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}


function showSubTab(context, tabId, btn) {
  const parent = document.getElementById(`tab-${context}`);
  parent.querySelectorAll('.sub-content').forEach(el => el.classList.remove('active'));
  parent.querySelectorAll('.sub-tab').forEach(el => el.classList.remove('active'));
  document.getElementById(`sub-${context}-${tabId}`).classList.add('active');
  btn.classList.add('active');
}


function renderAdminJugadores() {
  const container = document.getElementById('admin-jugadores-container');
  container.innerHTML = '';

  if (!appData.jugadores || appData.jugadores.length === 0) {
    container.innerHTML = '<p>No hay jugadores registrados en la base de datos.</p>';
    return;
  }

  // Contamos el total de partidos cargados actualmente en el Excel (dinámico)
  const totalPartidosAlMomento = appData.partidos.length;

  let html = `
    <div style="margin-bottom: 20px; font-weight: 500; color: #666;">
      📊 Total de cuentas activas: <strong>${appData.jugadores.length}</strong>
    </div>
    <div class="table-container">
      <table class="standings-table">
        <thead>
          <tr>
            <th style="text-align: left;">Usuario / Participante</th>
            <th>Rol</th>
            <th>Pronósticos Guardados</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
  `;

  appData.jugadores.forEach(j => {
    let estadoClass = '';
    let estadoTexto = '';

    if (j.rol === 'admin') {
      estadoClass = 'admin-tag';
      estadoTexto = 'Organizador';
    } else if (j.completados === totalPartidosAlMomento && totalPartidosAlMomento > 0) {
      estadoClass = 'completo';
      estadoTexto = '🎯 Todo Listo';
    } else if (j.completados > 0) {
      estadoClass = 'parcial';
      estadoTexto = '✏️ Incompleto';
    } else {
      estadoClass = 'vacio';
      estadoTexto = '💤 Sin arrancar';
    }

    html += `
          <tr>
            <td class="team-name" style="padding-left: 15px;">👤 ${j.usuario}</td>
            <td style="text-transform: capitalize; font-size: 0.85rem; color: #555;">${j.rol}</td>
            <td style="font-weight: 700; color: #2c3e50;">
              ${j.rol === 'admin' ? '-' : `${j.completados} / ${totalPartidosAlMomento}`}
            </td>
            <td>
              <span class="badge-status ${estadoClass}">${estadoTexto}</span>
            </td>
          </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

// Función para saber la fase de un partido desde el frontend
function getFaseKeyDePartidoFrontend(id) {
  if (id >= 1 && id <= 72) return 'grupos';
  if (id >= 73 && id <= 88) return 'f16';
  if (id >= 89 && id <= 96) return 'f8';
  if (id >= 97 && id <= 100) return 'f4';
  if (id >= 101 && id <= 102) return 'semi';
  if (id >= 103 && id <= 104) return 'final';
  return '';
}

// Ventana Modal del Perfil
// NUEVA FUNCIÓN AUXILIAR: Calcula cómo quedaría la tabla según lo que pronosticó el jugador
function generarTablaPerfilHTML(partidosGrupo, username) {
  let stats = {};
  partidosGrupo.forEach(p => {
    if (p.local && !stats[p.local]) stats[p.local] = { nombre: p.local, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
    if (p.visitante && !stats[p.visitante]) stats[p.visitante] = { nombre: p.visitante, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
  });

  const esPropio = username.toLowerCase() === currentUser.username.toLowerCase();

  partidosGrupo.forEach(p => {
    let op = esPropio ? appData.misPronosticos[p.id] : (appData.pronosticosOtros[p.id] ? appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === username.toLowerCase()) : null);

    if (op && op.gL !== "" && op.gV !== "") {
      const gL = parseInt(op.gL); const gV = parseInt(op.gV);
      stats[p.local].pj++; stats[p.visitante].pj++;
      stats[p.local].gf += gL; stats[p.local].gc += gV;
      stats[p.visitante].gf += gV; stats[p.visitante].gc += gL;
      
      if (gL > gV) { stats[p.local].pts += 3; stats[p.local].g++; stats[p.visitante].p++; }
      else if (gL < gV) { stats[p.visitante].pts += 3; stats[p.visitante].g++; stats[p.local].p++; }
      else { stats[p.local].pts += 1; stats[p.local].e++; stats[p.visitante].pts += 1; stats[p.visitante].e++; }
    }
  });

  let tabla = Object.values(stats);
  tabla.forEach(eq => eq.df = eq.gf - eq.gc);
  tabla.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.df !== a.df) return b.df - a.df;
    return b.gf - a.gf;
  });

  let html = `<div class="table-container" style="margin-top: 15px; margin-bottom: 35px;">
    <h4 style="text-align:center; color:#2c3e50; margin-bottom:10px; font-size: 0.9rem;">📊 Tabla según pronósticos de ${username}</h4>
    <table class="standings-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th style="text-align: left;">Equipo</th>
          <th>Pts</th><th>PJ</th><th>DF</th>
        </tr>
      </thead>
      <tbody>`;
  
  tabla.forEach((eq, index) => {
    let clase = index < 2 ? 'clasificado' : '';
    html += `<tr>
      <td style="font-weight: bold; color: #666; text-align: center;">${index + 1}</td>
      <td class="team-name ${clase}" style="text-align: left; display: flex; align-items: center; gap: 6px;">
        <span class="flag">${getBandera(eq.nombre)}</span> ${eq.nombre}
      </td>
      <td class="col-pts">${eq.pts}</td><td>${eq.pj}</td>
      <td>${eq.df > 0 ? '+'+eq.df : eq.df}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;
  return html;
}

// NUEVA VERSIÓN DEL MODAL: Con diseño de tarjetas y separado por grupos
function abrirPerfilJugador(username) {
  const userRank = appData.ranking.find(r => r.jugador.toLowerCase() === username.toLowerCase());
  const pts = userRank ? userRank.puntos : 0;
  const esPropio = username.toLowerCase() === currentUser.username.toLowerCase();

  // 1. BUSCAMOS EL NOMBRE REAL EN LA BASE DE DATOS
  const datosUsuario = appData.jugadores.find(j => j.usuario.toLowerCase() === username.toLowerCase());
  const nombreAMostrar = (datosUsuario && datosUsuario.nombreReal) ? datosUsuario.nombreReal : username;

  let html = `
    <div class="modal-overlay" id="perfil-modal" onclick="cerrarPerfil(event)">
      <div class="modal-content" style="max-width: 600px;" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <div class="modal-title">👤 Perfil de ${username} <span style="font-size: 0.9rem; color: #666; font-weight: normal;">(${nombreAMostrar})</span></div>
            <div style="font-size: 0.9rem; color: #0056b3; font-weight: 700; margin-top: 4px;">Puntos totales: ${pts} pts</div>
          </div>
          <button class="modal-close" onclick="document.getElementById('perfil-modal').remove()">&times;</button>
        </div>
        <div class="modal-body" style="background-color: #f0f2f5; padding: 15px;">
  `;

  // 3. DIBUJAMOS LA FASE DE GRUPOS (Esto te queda exactamente igual que antes)
  html += `<h2 style="text-align: center; margin-bottom: 20px; color: #333; font-size: 1.3rem;">Fase de Grupos</h2>`;
  
  if (appData.fases.grupos && !esPropio) {
    html += `<div class="info-card" style="text-align:center;">🔒 Los pronósticos de grupos están ocultos hasta que el Admin cierre la carga de resultados.</div>`;
  } else {
    for (let i = 0; i < 12; i++) {
      const letraGrupo = String.fromCharCode(65 + i);
      const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
      if (partidosGrupo.length === 0) continue;

      html += `<h3 class="group-title" style="margin-top: 0;">Grupo ${letraGrupo}</h3>`;
      
      partidosGrupo.forEach(p => {
        let op = esPropio ? appData.misPronosticos[p.id] : (appData.pronosticosOtros[p.id] ? appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === username.toLowerCase()) : null);
        let predText = op && op.gL !== "" && op.gV !== "" ? `${op.gL} - ${op.gV}` : `<span style="color:#d93025; font-size:0.85rem;">Sin cargar</span>`;
        
        let ptsGanados = 0;
        if (op && op.gL !== "" && op.gV !== "" && p.golesL !== null && p.golesV !== null) {
            ptsGanados = calcularPuntosEnFrente(op.gL, op.gV, p.golesL, p.golesV);
        }

        html += `
          <div class="match-card" style="margin-bottom: 12px; padding: 12px 15px;">
            <div class="match-header" style="margin-bottom: 8px;">${generarEncabezadoPartido(p)}</div>
            <div class="match-body">
              <div class="team local" style="font-size: 1rem;">${p.local}</div>
              <div style="background: #e8eaed; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 1.1rem; color: #111;">
                ${predText}
              </div>
              <div class="team visitante" style="font-size: 1rem;">${p.visitante}</div>
            </div>
            ${(p.golesL !== null && p.golesV !== null) ? `
              <div style="text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eee; font-size: 0.85rem; color: #555;">
                Resultado real: <strong>${p.golesL}-${p.golesV}</strong> | <strong style="color: ${ptsGanados > 0 ? '#137333' : '#666'};">+${ptsGanados} pts</strong>
              </div>
            ` : ''}
          </div>
        `;
      });
      // Inyectamos la tablita hipotética al final del grupo
      html += generarTablaPerfilHTML(partidosGrupo, username);
    }
  }

  // 2. DIBUJAMOS LAS ELIMINATORIAS
  html += `<h2 style="text-align: center; margin: 30px 0 20px 0; color: #333; font-size: 1.3rem;">Eliminatorias</h2>`;
  let elimsRendered = false;

  rondasFase2.forEach(ronda => {
    const partidosRonda = appData.partidos.filter(p => p.id >= ronda.min && p.id <= ronda.max);
    if (partidosRonda.length === 0) return;

    if (appData.fases[ronda.id] && !esPropio) {
       html += `<div class="info-card" style="text-align:center; margin-bottom: 10px;">🔒 ${ronda.nombre} oculta hasta su cierre.</div>`;
       elimsRendered = true;
    } else {
       html += `<h3 class="group-title" style="background-color: #8e44ad; margin-top: 0;">${ronda.nombre}</h3>`;
       
       partidosRonda.forEach(p => {
          let op = esPropio ? appData.misPronosticos[p.id] : (appData.pronosticosOtros[p.id] ? appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === username.toLowerCase()) : null);
          let predText = op && op.gL !== "" && op.gV !== "" ? `${op.gL} - ${op.gV}` : `<span style="color:#d93025; font-size:0.85rem;">Sin cargar</span>`;
          let ptsGanados = 0;
          
          if (op && op.gL !== "" && op.gV !== "" && p.golesL !== null && p.golesV !== null) {
              ptsGanados = calcularPuntosEnFrente(op.gL, op.gV, p.golesL, p.golesV);
          }

          html += `
            <div class="match-card" style="margin-bottom: 12px; padding: 12px 15px;">
              <div class="match-header" style="margin-bottom: 8px;">${generarEncabezadoPartido(p)}</div>
              <div class="match-body">
                <div class="team local" style="font-size: 1rem;">${p.local}</div>
                <div style="background: #e8eaed; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 1.1rem; color: #111;">
                  ${predText}
                </div>
                <div class="team visitante" style="font-size: 1rem;">${p.visitante}</div>
              </div>
              ${(p.golesL !== null && p.golesV !== null) ? `
                <div style="text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #eee; font-size: 0.85rem; color: #555;">
                  Resultado real: <strong>${p.golesL}-${p.golesV}</strong> | <strong style="color: ${ptsGanados > 0 ? '#137333' : '#666'};">+${ptsGanados} pts</strong>
                </div>
              ` : ''}
            </div>
          `;
       });
       elimsRendered = true;
    }
  });

  if (!elimsRendered) {
     html += `<p style="text-align:center; color:#666;">No hay partidos de eliminatorias cargados aún.</p>`;
  }

  html += `</div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarPerfil(e) {
  if (e.target.id === 'perfil-modal') document.getElementById('perfil-modal').remove();
}

function calcularMejoresTercerosReales() {
  let terceros = [];
  for (let i = 0; i < 12; i++) {
    const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
    if (partidosGrupo.length === 0) continue;
    
    let stats = {};
    partidosGrupo.forEach(p => {
      if (p.local && !stats[p.local]) stats[p.local] = { nombre: p.local, pts: 0, df: 0, gf: 0 };
      if (p.visitante && !stats[p.visitante]) stats[p.visitante] = { nombre: p.visitante, pts: 0, df: 0, gf: 0 };
    });

    partidosGrupo.forEach(p => {
      if (p.golesL !== null && p.golesV !== null) {
        let gL = parseInt(p.golesL); let gV = parseInt(p.golesV);
        stats[p.local].df += (gL - gV); stats[p.local].gf += gL;
        stats[p.visitante].df += (gV - gL); stats[p.visitante].gf += gV;
        if (gL > gV) stats[p.local].pts += 3;
        else if (gL < gV) stats[p.visitante].pts += 3;
        else { stats[p.local].pts += 1; stats[p.visitante].pts += 1; }
      }
    });

    let tabla = Object.values(stats).sort((a,b) => b.pts - a.pts || b.df - a.df || b.gf - a.gf);
    if (tabla[2]) terceros.push(tabla[2]); 
  }
  // Ordenamos la tabla global de terceros de mejor a peor
  terceros.sort((a,b) => b.pts - a.pts || b.df - a.df || b.gf - a.gf);
  // Retornamos solo los nombres de los 8 mejores
  return terceros.slice(0, 8).map(t => t.nombre);
}

function renderPremiosRandom() {
  console.log("Iniciando dibujado de Premios Random...");
  
  const container = document.getElementById('tab-extras');
  
  if (!container) {
    console.error("¡ERROR CRÍTICO! No se encontró el div con id='tab-extras' en el HTML.");
    return;
  }

  const gruposAbiertos = appData.fases.grupos;
  let html = `<h2 style="text-align:center; margin-bottom: 20px; color: #2c3e50;">🎲 Premios Random</h2>`;

  if (gruposAbiertos) {
    html += `
      <div class="info-card" style="margin-bottom: 20px; text-align: center;">
        Tenés tiempo hasta que cierre la Fase de Grupos para modificar tus elecciones. No suman puntos.
      </div>
      <div class="extras-form" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div class="form-group"><label>⚽ Máximo Goleador del torneo</label><input type="text" id="ext-goleador" class="inp-extra" value="${appData.misExtras.goleador || ''}" placeholder="Ej: Mbappé"></div>
        <div class="form-group"><label>👟 Máximo Asistidor</label><input type="text" id="ext-asistidor" class="inp-extra" value="${appData.misExtras.asistidor || ''}" placeholder="Ej: De Bruyne"></div>
        <div class="form-group"><label>🟨 Jugador con más Amarillas</label><input type="text" id="ext-amarillas" class="inp-extra" value="${appData.misExtras.amarillas || ''}" placeholder="Ej: Cuti Romero"></div>
        <div class="form-group"><label>⚡ Partidos demorados por tormenta</label><input type="number" min="0" id="ext-tormentas" class="inp-extra" value="${appData.misExtras.tormentas !== undefined ? appData.misExtras.tormentas : ''}" placeholder="Cantidad (Ej: 2)"></div>
        <div class="form-group"><label>🏃‍♂️ Invasiones de cancha por hinchas</label><input type="number" min="0" id="ext-invasiones" class="inp-extra" value="${appData.misExtras.invasiones !== undefined ? appData.misExtras.invasiones : ''}" placeholder="Cantidad (Ej: 5)"></div>
        <div class="form-group"><label>🔥 Equipo más goleador</label><input type="text" id="ext-eqgoleador" class="inp-extra" value="${appData.misExtras.eqgoleador || ''}" placeholder="Ej: Francia"></div>
        <div class="form-group"><label>🛡️ Equipo más goleado</label><input type="text" id="ext-eqgoleado" class="inp-extra" value="${appData.misExtras.eqgoleado || ''}" placeholder="Ej: Costa Rica"></div>
        
        <button id="btn-save-extras" onclick="guardarExtras()" style="width: 100%; margin-top: 15px; background: #8e44ad; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1.1rem;">Guardar Apuestas Random</button>
      </div>
    `;
  } else {
    html += `<div class="info-card" style="text-align:center; margin-bottom: 20px;">🔒 Apuestas cerradas. Acá podés ver qué puso cada uno.</div>`;
    const catMap = { goleador: '⚽ Goleador', asistidor: '👟 Asistidor', amarillas: '🟨 Amarillas', tormentas: '⚡ Tormentas', invasiones: '🏃‍♂️ Invasiones', eqgoleador: '🔥 Eq. Goleador', eqgoleado: '🛡️ Eq. Goleado' };

    html += `
      <h3 style="margin-top: 10px; font-size: 1.1rem; color: #333;">Tus Pronósticos vs Realidad</h3>
      <div class="table-container" style="margin-bottom: 30px;">
        <table class="standings-table">
          <thead><tr><th style="text-align: left;">Categoría</th><th>Resultado Oficial</th><th>Tu Voto</th></tr></thead>
          <tbody>
    `;

    Object.keys(catMap).forEach(k => {
      const real = appData.resultadosExtras[k] || '⏳ Pendiente';
      const mio = appData.misExtras[k] || '-';
      html += `<tr><td style="font-weight:bold; text-align: left;">${catMap[k]}</td><td style="color:#137333; font-weight:bold;">${real}</td><td>${mio}</td></tr>`;
    });
    html += `</tbody></table></div>`;

    if (appData.extrasComunidad.length > 0) {
      html += `<h3 style="margin-top:20px; font-size: 1.1rem; color: #333;">👀 Qué mandó el resto del grupo</h3>`;
      html += `<div class="table-container">
        <table class="standings-table" style="font-size: 0.8rem; white-space: nowrap;">
          <thead><tr><th>Jugador</th><th>⚽ Gol</th><th>👟 Asis</th><th>🟨 Amar</th><th>⚡ Tor</th><th>🏃‍♂️ Inv</th><th>🔥 Eq+</th><th>🛡️ Eq-</th></tr></thead>
          <tbody>`;
      
      appData.extrasComunidad.forEach(user => {
        html += `<tr>
          <td style="font-weight:bold; text-align: left;">${user.jugador}</td>
          <td>${user.goleador || '-'}</td><td>${user.asistidor || '-'}</td>
          <td>${user.amarillas || '-'}</td><td>${user.tormentas !== '' ? user.tormentas : '-'}</td>
          <td>${user.invasiones !== '' ? user.invasiones : '-'}</td>
          <td>${user.eqgoleador || '-'}</td><td>${user.eqgoleado || '-'}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    }
  }

  container.innerHTML = html;
  console.log("¡Formulario inyectado con éxito en el HTML!");
}

async function guardarExtras() {
  const btn = document.getElementById('btn-save-extras');
  btn.innerText = 'Guardando en la nube...';
  btn.disabled = true;

  const extras = {
    goleador: document.getElementById('ext-goleador').value.trim(),
    asistidor: document.getElementById('ext-asistidor').value.trim(),
    amarillas: document.getElementById('ext-amarillas').value.trim(),
    tormentas: document.getElementById('ext-tormentas').value.trim(),
    invasiones: document.getElementById('ext-invasiones').value.trim(),
    eqgoleador: document.getElementById('ext-eqgoleador').value.trim(),
    eqgoleado: document.getElementById('ext-eqgoleado').value.trim()
  };

  try {
    await apiCall('saveExtras', { username: currentUser.username, extras: extras });
    appData.misExtras = extras;
    
    // Cambiamos el color del botón un par de segundos para dar feedback visual de éxito
    btn.style.backgroundColor = '#137333';
    btn.innerText = '¡Guardado exitoso! ✔️';
    setTimeout(() => {
      btn.style.backgroundColor = '#8e44ad';
      btn.innerText = 'Guardar Apuestas Random';
      btn.disabled = false;
    }, 2500);

  } catch(e) {
    alert("Error al guardar: " + e.message);
    btn.innerText = 'Guardar Apuestas Random';
    btn.disabled = false;
  }
}

function toggleMenu() {
  const menu = document.getElementById('menu-tabs');
  menu.classList.toggle('open');
}


function iniciarContadorRegresivo() {
  const banner = document.getElementById('countdown-banner');
  if (!banner) return;

  // Si el Admin ya cerró la Fase de Grupos en el switch, ocultamos el cartel por completo
  if (appData && appData.fases && appData.fases.grupos === false) {
    banner.style.display = 'none';
    return;
  }

  // Fecha límite exacta: 11 de Junio de 2026 a las 12:00 PM (Mediodía)
  const fechaLimite = new Date("June 11, 2026 12:00:00").getTime();

  // Actualizamos el contador cada 1 segundo
  const intervalo = setInterval(function() {
    const ahora = new Date().getTime();
    const distancia = fechaLimite - ahora;

    // Si se cumplió el tiempo
    if (distancia < 0) {
      clearInterval(intervalo);
      document.getElementById("countdown-text").innerHTML = "🔒 <strong>¡Tiempo cumplido!</strong> Pronósticos bloqueados.";
      banner.style.background = "#f8d7da";
      banner.style.color = "#721c24";
      banner.style.borderColor = "#f5c6cb";
      return;
    }

    // Cálculos matemáticos de tiempo
    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    // Inyectamos el texto dinámico
    document.getElementById("countdown-text").innerHTML = 
      `Quedan <strong>${dias}d ${horas}h ${minutos}m ${segundos}s</strong> para mandar tus grupos.`;
  }, 1000);
}

function cerrarPopup() {
  const banner = document.getElementById('countdown-banner');
  if (banner) banner.style.display = 'none'; // Se oculta temporalmente hasta que recarguen
}

// Función para mostrar/ocultar los pronósticos del resto en la pestaña Resultados
function togglePronosticos(btn, partidoId) {
  const container = document.getElementById(`others-match-${partidoId}`);
  if (container) {
    const isHidden = container.classList.contains('hidden');
    if (isHidden) {
      container.classList.remove('hidden');
      btn.innerHTML = 'Ocultar pronósticos ⬆️';
      btn.style.background = '#e2e6ea'; // Un gris apenitas más oscuro al abrir
    } else {
      container.classList.add('hidden');
      btn.innerHTML = 'Ver pronósticos del grupo ⬇️';
      btn.style.background = '#f1f3f4';
    }
  }
}

function toggleGrupoContent(letra) {
  const container = document.getElementById(`content-grupo-${letra}`);
  const btnText = document.getElementById(`btn-text-grupo-${letra}`);
  if (container) {
    const isHidden = container.classList.contains('hidden');
    if (isHidden) {
      container.classList.remove('hidden');
      if (btnText) btnText.innerText = `GRUPO ${letra} ⬆️`;
    } else {
      container.classList.add('hidden');
      if (btnText) btnText.innerText = `GRUPO ${letra} ⬇️`;
    }
  }
}


let rankingChartInstance = null; // Guardamos la instancia para destruirla si se recarga


function renderGraficoEvolucion() {
  const ctx = document.getElementById('rankingChart').getContext('2d');
  
  const partidosJugados = appData.partidos
    .filter(p => p.golesL !== null && p.golesV !== null)
    .sort((a, b) => a.id - b.id);

  if (partidosJugados.length === 0) return; 

  let usuarios = appData.jugadores.filter(j => j.rol !== 'admin').map(j => j.usuario);
  let historial = {};
  usuarios.forEach(u => historial[u] = { pts: 0, exactos: 0, posiciones: [], puntosEje: [] });

  let labelsX = [];

  // Máquina del tiempo
  partidosJugados.forEach((p) => {
    labelsX.push(`P${p.id}`); 

    usuarios.forEach(u => {
      let uLower = u.toLowerCase();
      let op = null;
      if (uLower === currentUser.username.toLowerCase()) {
        op = appData.misPronosticos[p.id];
      } else if (appData.pronosticosOtros[p.id]) {
        op = appData.pronosticosOtros[p.id].find(o => o.jugador.toLowerCase() === uLower);
      }
      if (op && op.gL !== "" && op.gV !== "") {
        let pts = calcularPuntosEnFrente(op.gL, op.gV, p.golesL, p.golesV);
        historial[u].pts += pts;
        if (pts === 7) historial[u].exactos += 1;
      }
    });

    let snapshot = usuarios.map(u => ({ usuario: u, pts: historial[u].pts, exactos: historial[u].exactos }));
    snapshot.sort((a, b) => b.pts - a.pts || b.exactos - a.exactos);
    
    snapshot.forEach((snap, indexPos) => {
      historial[snap.usuario].posiciones.push(indexPos + 1);
      historial[snap.usuario].puntosEje.push(snap.pts);
    });
  });

  let rankingFinal = [...usuarios].sort((a, b) => {
    return (historial[b].pts - historial[a].pts) || (historial[b].exactos - historial[a].exactos);
  });
  let top3 = rankingFinal.slice(0, 3); 

  const datasets = usuarios.map((u, i) => {
    const hue = (i * 137.508) % 360; 
    const color = `hsl(${hue}, 70%, 50%)`;
    const isMe = u.toLowerCase() === currentUser.username.toLowerCase();
    
    const isTop3 = top3.includes(u);
    const showByDefault = isMe || isTop3;

    return {
      label: u,
      data: historial[u].posiciones,
      puntosAnexados: historial[u].puntosEje, 
      borderColor: isMe ? '#11181f' : color, 
      borderWidth: isMe ? 4 : 2,
      tension: 0, 
      pointRadius: isMe ? 4 : 0, 
      pointHoverRadius: 6,
      backgroundColor: 'transparent',
      hidden: !showByDefault 
    };
  });

  if (rankingChartInstance) rankingChartInstance.destroy();

  rankingChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsX,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          reverse: true, 
          min: 0.5, // 1. TRUCO DEL TECHO: Empuja el #1 hacia abajo para que no se corte
          max: usuarios.length + 0.5,
          ticks: { 
            stepSize: 1, 
            // 2. Ocultamos el '0.5' y mostramos solo enteros limpios
            callback: function(value) {
              if (value % 1 === 0) return value;
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { 
            usePointStyle: true, 
            boxWidth: 8,
            padding: 15,
            // 3. ELIMINAMOS EL TACHADO: Engañamos a Chart.js y pintamos de gris manualmente
            generateLabels: function(chart) {
              return chart.data.datasets.map((dataset, i) => {
                const isHidden = !chart.isDatasetVisible(i);
                return {
                  text: dataset.label,
                  fillStyle: isHidden ? 'transparent' : dataset.borderColor,
                  strokeStyle: isHidden ? '#ccc' : dataset.borderColor,
                  lineWidth: 2,
                  hidden: false, // Magia: Le decimos que NO está oculto para que no lo tache
                  datasetIndex: i,
                  fontColor: isHidden ? '#b0b0b0' : '#333' // Letra gris clarita
                };
              });
            }
          },
          // Como engañamos al motor arriba, tenemos que reimplementar el clic:
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            if (ci.isDatasetVisible(index)) ci.hide(index);
            else ci.show(index);
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          itemSort: function(a, b) {
            return a.parsed.y - b.parsed.y;
          },
          callbacks: {
            title: function(context) {
              return 'Resultados tras el ' + context[0].label;
            },
            label: function(context) {
              let user = context.dataset.label;
              let pos = context.parsed.y;
              let index = context.dataIndex;
              let pts = context.dataset.puntosAnexados[index];
              let medalla = pos === 1 ? '🥇 ' : pos === 2 ? '🥈 ' : pos === 3 ? '🥉 ' : '';
              return `${medalla}#${pos} - ${user}: ${pts} pts`;
            },
            // 4. MÁQUINA DEL TIEMPO: El super-agregado para saber qué pasaba en ese momento
            afterBody: function(context) {
              let matchIndex = context[0].dataIndex;
              // Calculamos cómo estaba TODO el ranking en ese partido específico
              let snapshot = usuarios.map(u => ({
                u: u,
                pos: historial[u].posiciones[matchIndex],
                pts: historial[u].puntosEje[matchIndex]
              }));
              snapshot.sort((a, b) => a.pos - b.pos);
              
              // Lo inyectamos al final del cuadrito negro del tooltip
              let lines = ['', '--- LÍDERES EN ESTE MOMENTO ---'];
              snapshot.slice(0, 3).forEach(s => {
                let m = s.pos === 1 ? '🥇' : s.pos === 2 ? '🥈' : '🥉';
                lines.push(`${m} ${s.u} (${s.pts} pts)`);
              });
              return lines;
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

function toggleGrafico() {
  const wrapper = document.getElementById('grafico-wrapper');
  wrapper.classList.toggle('hidden');
}

function renderSimuladorInit() {
  const container = document.getElementById('simulador-controls');
  if(!container) return;

  // Filtramos: Partidos SIN resultado oficial, pero cuya FASE YA ESTÉ CERRADA (para tener los datos del resto)
  const partidosPendientes = appData.partidos.filter(p => 
    p.golesL === null && 
    p.golesV === null && 
    appData.fases[getFaseKeyDePartidoFrontend(p.id)] === false
  );

  if(partidosPendientes.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; font-weight: 500;">⏳ No hay partidos bloqueados pendientes de jugarse en este momento. Esperá a que el Admin cierre la próxima fase para poder simular.</p>';
    document.getElementById('simulador-table-container').innerHTML = '';
    return;
  }

  let optionsHtml = partidosPendientes.map(p => 
    `<option value="${p.id}">Partido ${p.id}: ${p.local} vs ${p.visitante}</option>`
  ).join('');

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <label style="font-weight: bold; margin-bottom: 8px; display: block; color: #2c3e50;">1. Seleccioná el partido en juego:</label>
        <select id="sim-partido-select" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #ccc; font-size: 1rem; cursor: pointer;">
          ${optionsHtml}
        </select>
      </div>
      
      <div>
        <label style="font-weight: bold; margin-bottom: 8px; display: block; color: #2c3e50;">2. Ingresá el resultado imaginario:</label>
        <div style="display: flex; align-items: center; gap: 10px; justify-content: center; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px dashed #ccc;">
          <input type="number" id="sim-gL" class="inp-score" min="0" placeholder="-">
          <span style="font-weight: 900; font-size: 1.2rem; color: #888;">VS</span>
          <input type="number" id="sim-gV" class="inp-score" min="0" placeholder="-">
        </div>
      </div>
      
      <button onclick="ejecutarSimulacion()" style="background: #8e44ad; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 1.05rem; transition: background 0.2s; margin-top: 5px;">
        ✨ Simular Tabla
      </button>
    </div>
  `;
}

function ejecutarSimulacion() {
  const matchId = parseInt(document.getElementById('sim-partido-select').value);
  const simGL = document.getElementById('sim-gL').value;
  const simGV = document.getElementById('sim-gV').value;

  if(simGL === "" || simGV === "") {
    alert("Por favor, ingresá los goles de ambos equipos para simular.");
    return;
  }

  const rL = parseInt(simGL);
  const rV = parseInt(simGV);

  // 1. Clonamos el ranking actual para no romper los datos reales
  let rankingSimulado = appData.ranking.map(r => ({
    jugador: r.jugador,
    puntos: r.puntos,
    exactos: r.exactos,
    ptsGanadosAhora: 0
  }));

  // 2. Calculamos los puntos extra para cada jugador en base al resultado imaginario
  rankingSimulado.forEach(r => {
    let uLower = r.jugador.toLowerCase();
    let op = null;
    
    if (uLower === currentUser.username.toLowerCase()) {
      op = appData.misPronosticos[matchId];
    } else if (appData.pronosticosOtros[matchId]) {
      op = appData.pronosticosOtros[matchId].find(o => o.jugador.toLowerCase() === uLower);
    }

    if (op && op.gL !== "" && op.gV !== "") {
      let pts = calcularPuntosEnFrente(op.gL, op.gV, rL, rV);
      r.puntos += pts;
      r.ptsGanadosAhora = pts;
      if (pts === 7) r.exactos += 1;
    }
  });

  // 3. Re-ordenamos la tabla simulada
  rankingSimulado.sort((a, b) => b.puntos - a.puntos || b.exactos - a.exactos);

  // 4. Dibujamos la nueva tabla resaltando lo que sumó cada uno
  let html = `
    <h3 style="margin: 25px 0 15px 0; text-align: center; color: #8e44ad; border-top: 2px dashed #eee; padding-top: 20px;">
      📊 Así quedaría la tabla general
    </h3>
    <div class="table-container">
      <table class="standings-table">
        <thead>
          <tr>
            <th style="width: 50px;">Pos</th>
            <th style="text-align: left;">Jugador</th>
            <th>Puntos Hoy</th>
            <th>Total Simulado</th>
          </tr>
        </thead>
        <tbody>
  `;

  rankingSimulado.forEach((row, index) => {
    let medalla = index + 1;
    if (index === 0) medalla = "🥇"; if (index === 1) medalla = "🥈"; if (index === 2) medalla = "🥉";
    let esSocio = currentUser && row.jugador.toLowerCase() === currentUser.username.toLowerCase() ? 'highlight-user' : '';

    let badgePuntos = row.ptsGanadosAhora > 0 
      ? `<span style="background: #e6f4ea; color: #137333; padding: 4px 8px; border-radius: 4px; font-weight: 800;">+${row.ptsGanadosAhora}</span>` 
      : `<span style="color: #bbb; font-weight: 600;">0</span>`;

    html += `
          <tr class="${esSocio}">
            <td style="font-weight: 700;">${medalla}</td>
            <td class="team-name">${row.jugador}</td>
            <td>${badgePuntos}</td>
            <td class="col-pts" style="color: #8e44ad;">${row.puntos} pts</td>
          </tr>`;
  });
  html += `</tbody></table></div>`;

  document.getElementById('simulador-table-container').innerHTML = html;
}