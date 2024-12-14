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
                            convertBtn.disabled = true;
                            const selectedText = selection;
                            const requestBody = {
                                prompt: selectedText,
                                languageTo: select2.value
                            };

                            if (select1.value !== 'Automatic') {
                                requestBody.languageFrom = select1.value;
                            }

                            const apiResponse = await fetch("https://syntha.ai/api/ai-public/converter", {
                                headers: {
                                    "accept": "*/*",
                                },
                                body: JSON.stringify(requestBody),
                                method: "POST",
                                mode: "cors",
                                credentials: "include"
                            });
                            var text = await apiResponse.text();
                            var structuredCode = estructurarCodigo(text);
                            chrome.scripting.executeScript({
                                target: { tabId: tabs[0].id },
                                func: (structuredCode) => {
                                    const selection = window.getSelection();
                                    if (selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);
                                        range.deleteContents();
                                        range.insertNode(document.createTextNode(structuredCode));
                                    }
                                },
                                args: [structuredCode]
                            });
                            convertBtn.disabled = false;
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
    const lineasCodigo = entrada.split('\n').filter(linea => linea.startsWith('0:'));
    
    const codigoUnido = lineasCodigo
      .map(linea => {
        let contenido = linea.substring(3).replace(/^"|"$/g, '');
        contenido = contenido.replace(/\\n/g, '\n');
        contenido = contenido.replace(/\\"/g, '"');
        return contenido;
      })
      .join('');

    return codigoUnido;
  }
  
  
  