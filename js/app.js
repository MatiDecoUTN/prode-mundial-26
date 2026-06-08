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
  document.getElementById('inp-pass').value = '';
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-admin').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
}


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
    }
  } catch (err) { alert("Error: " + err.message); } finally { loading.classList.add('hidden'); }
}
// Diccionario de Emojis de Banderas
const banderas = {
  "Argentina": "🇦🇷", "México": "🇲🇽", "Estados Unidos": "🇺🇸", "Canadá": "🇨🇦",
  "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷", "Chequia": "🇨🇿",
  "Bosnia y Herz.": "🇧🇦", "Qatar": "🇶🇦", "Suiza": "🇨🇭",
  "Brasil": "🇧🇷", "Marruecos": "🇲🇦", "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turquía": "🇹🇷",
  "Alemania": "🇩🇪", "Curazao": "🇨🇼", "Costa de Marfil": "🇨🇮", "Ecuador": "🇪🇨",
  "Austria": "🇦🇹", "Jordania": "🇯🇴", "Argelia": "🇩🇿",
  "Portugal": "🇵🇹", "Colombia": "🇨🇴", "Uzbekistán": "🇺🇿", "DR Congo": "🇨🇩",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷", "Ghana": "🇬🇭", "Panamá": "🇵🇦"
};

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

// Función para buscar la bandera (si no la encuentra, pone una banderita blanca)
function getBandera(pais) {
  return banderas[pais.trim()] || "🏳️";
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
          <div class="team local">${p.local}</div>
          <div class="score-inputs">
            <input type="number" min="0" class="inp-score" id="gL_${p.id}" value="${appData.misPronosticos[p.id] ? appData.misPronosticos[p.id].gL : ''}" oninput="actualizarTablas()" ${!appData.fases.grupos ? 'disabled' : ''}>
            <span class="vs">VS</span>
            <input type="number" min="0" class="inp-score" id="gV_${p.id}" value="${appData.misPronosticos[p.id] ? appData.misPronosticos[p.id].gV : ''}" oninput="actualizarTablas()" ${!appData.fases.grupos ? 'disabled' : ''}>
          </div>
          <div class="team visitante">${p.visitante}</div>
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

    // 1. Inicializamos las estadísticas de los 4 equipos del grupo en cero
    let stats = {};
    partidosGrupo.forEach(p => {
      if (!stats[p.local]) stats[p.local] = { nombre: p.local, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
      if (!stats[p.visitante]) stats[p.visitante] = { nombre: p.visitante, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
    });

    // 2. Leemos lo que el usuario escribió en los inputs y sumamos
    partidosGrupo.forEach(p => {
      const inL = document.getElementById(`gL_${p.id}`);
      const inV = document.getElementById(`gV_${p.id}`);
      
      if (inL && inV && inL.value !== "" && inV.value !== "") {
        const gL = parseInt(inL.value);
        const gV = parseInt(inV.value);

        stats[p.local].pj++;
        stats[p.visitante].pj++;
        stats[p.local].gf += gL;
        stats[p.local].gc += gV;
        stats[p.visitante].gf += gV;
        stats[p.visitante].gc += gL;

        if (gL > gV) {
          stats[p.local].pts += 3; stats[p.local].g++;
          stats[p.visitante].p++;
        } else if (gL < gV) {
          stats[p.visitante].pts += 3; stats[p.visitante].g++;
          stats[p.local].p++;
        } else {
          stats[p.local].pts += 1; stats[p.local].e++;
          stats[p.visitante].pts += 1; stats[p.visitante].e++;
        }
      }
    });

    // 3. Convertimos a Array, calculamos Dif. de Gol y Ordenamos (Pts > DF > GF)
    let tabla = Object.values(stats);
    tabla.forEach(eq => eq.df = eq.gf - eq.gc);

    tabla.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.df !== a.df) return b.df - a.df;
      return b.gf - a.gf;
    });

    // 4. Inyectamos el HTML de la tabla al final del grupo
    const divTabla = document.getElementById(`tabla-grupo-${letraGrupo}`);
    if(divTabla) {
      let html = `
        <div class="table-container">
          <table class="standings-table">
            <thead>
              <tr>
                <th>Equipo</th><th>Pts</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DF</th>
              </tr>
            </thead>
            <tbody>
      `;
      tabla.forEach((eq, index) => {
        // Los dos primeros marcan clasificación directa
        let clase = index < 2 ? 'clasificado' : ''; 
        html += `
              <tr>
                <td class="team-name ${clase}">${eq.nombre}</td>
                <td class="col-pts">${eq.pts}</td>
                <td>${eq.pj}</td>
                <td>${eq.g}</td>
                <td>${eq.e}</td>
                <td>${eq.p}</td>
                <td>${eq.gf}</td>
                <td>${eq.gc}</td>
                <td>${eq.df > 0 ? '+'+eq.df : eq.df}</td>
              </tr>
        `;
      });
      html += `</tbody></table></div>`;
      divTabla.innerHTML = html;
    }
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

  for (let i = 0; i < 12; i++) {
    const letraGrupo = String.fromCharCode(65 + i);
    const partidosGrupo = appData.partidos.filter(p => p.id > (i * 6) && p.id <= ((i + 1) * 6));
    if (partidosGrupo.length === 0) continue;
    const title = document.createElement('h3'); title.className = 'group-title'; title.innerText = `Grupo ${letraGrupo}`;
    contGrupos.appendChild(title);
    partidosGrupo.forEach(p => {
      let ptsGanados = 0; let tieneProde = appData.misPronosticos[p.id];
      if (p.golesL !== null && p.golesV !== null && tieneProde) { ptsGanados = calcularPuntosEnFrente(tieneProde.gL, tieneProde.gV, p.golesL, p.golesV); puntosTotalesJugador += ptsGanados; }
      const card = document.createElement('div'); card.className = `match-card ${p.golesL !== null ? 'partido-jugado' : ''}`;
      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local}</div>
          <div class="score-display"><span class="score-num">${p.golesL !== null ? p.golesL : '-'}</span> : <span class="score-num">${p.golesV !== null ? p.golesV : '-'}</span></div>
          <div class="team visitante">${p.visitante}</div>
        </div>
        ${tieneProde ? `<div class="user-prediction-badge">Prode: ${tieneProde.gL}-${tieneProde.gV} | <strong style="color: ${ptsGanados > 0 ? '#137333' : '#666'}">+${ptsGanados} pts</strong></div>` : ``}
      `;
      contGrupos.appendChild(card);
    });
    const divTabla = document.createElement('div'); divTabla.innerHTML = generarTablaRealHTML(partidosGrupo); contGrupos.appendChild(divTabla);
  }

  rondasFase2.forEach(ronda => {
    const partidosRonda = appData.partidos.filter(p => p.id >= ronda.min && p.id <= ronda.max);
    if (partidosRonda.length === 0) return;
    const title = document.createElement('h3'); title.className = 'group-title'; title.style.backgroundColor = "#8e44ad"; title.innerText = ronda.nombre;
    contElims.appendChild(title);
    partidosRonda.forEach(p => {
      let ptsGanados = 0; let tieneProde = appData.misPronosticos[p.id];
      if (p.golesL !== null && p.golesV !== null && tieneProde) { ptsGanados = calcularPuntosEnFrente(tieneProde.gL, tieneProde.gV, p.golesL, p.golesV); puntosTotalesJugador += ptsGanados; }
      const card = document.createElement('div'); card.className = `match-card ${p.golesL !== null ? 'partido-jugado' : ''}`;
      card.innerHTML = `
        <div class="match-header">${generarEncabezadoPartido(p)}</div>
        <div class="match-body">
          <div class="team local">${p.local}</div>
          <div class="score-display"><span class="score-num">${p.golesL !== null ? p.golesL : '-'}</span> : <span class="score-num">${p.golesV !== null ? p.golesV : '-'}</span></div>
          <div class="team visitante">${p.visitante}</div>
        </div>
        ${tieneProde ? `<div class="user-prediction-badge">Prode: ${tieneProde.gL}-${tieneProde.gV} | <strong style="color: ${ptsGanados > 0 ? '#137333' : '#666'}">+${ptsGanados} pts</strong></div>` : ``}
      `;
      contElims.appendChild(card);
    });
  });
  document.getElementById('prode-pts-badge').innerText = `🏆 Mis Puntos: ${puntosTotalesJugador} pts`;
}

// TAB: Ranking General (La tabla de posiciones de tus amigos)
function renderRankingGeneral() {
  const container = document.getElementById('ranking-container');
  container.innerHTML = '';

  if (appData.ranking.length === 0) {
    container.innerHTML = '<p>El torneo no empezó. ¡Pronto verás las posiciones acá!</p>';
    return;
  }

  let html = `
    <div class="table-container">
      <table class="standings-table">
        <thead>
          <tr>
            <th style="width: 70px;">Pos</th>
            <th style="text-align: left;">Jugador</th>
            <th>Puntos</th>
          </tr>
        </thead>
        <tbody>
  `;

  appData.ranking.forEach((row, index) => {
    let medalla = index + 1;
    if (index === 0) medalla = "🥇";
    if (index === 1) medalla = "🥈";
    if (index === 2) medalla = "🥉";

    // Resaltamos al usuario actual en la tabla con una clase
    let esSocio = row.jugador.toLowerCase() === currentUser.username.toLowerCase() ? 'highlight-user' : '';

    html += `
          <tr class="${esSocio}">
            <td style="font-size: 1.1rem; font-weight: 700;">${medalla}</td>
            <td class="team-name">${row.jugador}</td>
            <td class="col-pts" style="font-size: 1.1rem;">${row.puntos} pts</td>
          </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
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
  
  // Inicializamos los 4 equipos
  partidosGrupo.forEach(p => {
    if (p.local && !stats[p.local]) stats[p.local] = { nombre: p.local, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
    if (p.visitante && !stats[p.visitante]) stats[p.visitante] = { nombre: p.visitante, pts: 0, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
  });

  // Calculamos en base a los goles oficiales (p.golesL y p.golesV)
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

  let tabla = Object.values(stats);
  tabla.forEach(eq => eq.df = eq.gf - eq.gc);
  tabla.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.df !== a.df) return b.df - a.df;
    return b.gf - a.gf;
  });

  let html = `<div class="table-container" style="margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 15px;">
    <h4 style="text-align:center; color:#2c3e50; margin-bottom:10px;">🏆 Tabla Oficial del Grupo</h4>
    <table class="standings-table">
      <thead><tr><th>Equipo</th><th>Pts</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DF</th></tr></thead>
      <tbody>`;
  
  tabla.forEach((eq, index) => {
    let clase = index < 2 ? 'clasificado' : '';
    html += `<tr><td class="team-name ${clase}">${eq.nombre}</td><td class="col-pts">${eq.pts}</td><td>${eq.pj}</td><td>${eq.g}</td><td>${eq.e}</td><td>${eq.p}</td><td>${eq.gf}</td><td>${eq.gc}</td><td>${eq.df > 0 ? '+'+eq.df : eq.df}</td></tr>`;
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