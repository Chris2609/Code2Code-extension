// popup.js
function addConvertButtonListener() {
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        const select1 = document.getElementById('from');
        const select2 = document.getElementById('to');
        convertBtn.addEventListener('click', async () => {
            try {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: () => window.getSelection().toString()
                    }, async (results) => {
                        const selection = results[0].result;
                        if (selection) {
                            const selectedText = selection;
                            const apiResponse = await fetch("https://syntha.ai/api/ai-public/converter", {
                                headers: {
                                    "accept": "*/*",
                                },
                                referrer: "https://syntha.ai/converters/java-to-kotlin",
                                referrerPolicy: "strict-origin-when-cross-origin",
                                body: JSON.stringify({
                                    prompt: selectedText,
                                    languageFrom: select1.value,
                                    languageTo: select2.value
                                }),
                                method: "POST",
                                mode: "cors",
                                credentials: "include"
                            });
                            
                            var text = await apiResponse.text();
                            console.log(estructurarCodigo(text));
                        }
                    });
                });
            } catch (error) {
                console.error('Error:', error);
            }
        });
        return true;
    }
    return false;
}

const intervalId = setInterval(() => {
    if (addConvertButtonListener()) {
        clearInterval(intervalId);
    }
}, 100);

function estructurarCodigo(entrada) {
    // Filtrar las líneas que comienzan con "0:"
    const lineasCodigo = entrada.split('\n').filter(linea => linea.startsWith('0:'));
    
    // Extraer el contenido después de "0:" y unirlo, preservando los caracteres de escape
    const codigoUnido = lineasCodigo
      .map(linea => {
        // Eliminar el "0:" inicial y las comillas externas
        let contenido = linea.substring(3).replace(/^"|"$/g, '');
        // Reemplazar "\\n" por un salto de línea real
        contenido = contenido.replace(/\\n/g, '\n');
        // Reemplazar comillas escapadas por comillas simples
        contenido = contenido.replace(/\\"/g, '"');
        return contenido;
      })
      .join('');
    
    // Devolver el código estructurado
    return codigoUnido;
  }
  
  
  