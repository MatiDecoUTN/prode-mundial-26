// js/data.js

async function apiCall(action, payload = {}) {
  const data = { action: action, ...payload };
  
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(data)
    });
    
    // Primero leemos la respuesta como texto para poder debuguearla
    const textResponse = await response.text();
    console.log("📩 Respuesta cruda del servidor:", textResponse);
    
    let result;
    try {
      result = JSON.parse(textResponse);
    } catch (jsonError) {
      console.error("❌ Error al parsear JSON. La respuesta no es un objeto válido.");
      throw new Error("El servidor devolvió un formato incorrecto (HTML/Texto). Revisá la consola.");
    }
    
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || "Error desconocido en el servidor");
    }
  } catch (error) {
    console.error("🚨 Error detallado en la petición:", error);
    throw new Error(error.message || "Error de conexión.");
  }
}