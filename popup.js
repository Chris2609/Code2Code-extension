// popup.js
function addConvertButtonListener() {
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
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
                                    "content-type": "application/json",
                                    "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                                    "sec-ch-ua-mobile": "?0",
                                    "sec-ch-ua-platform": "\"Windows\""
                                },
                                referrer: "https://syntha.ai/converters/java-to-kotlin",
                                referrerPolicy: "strict-origin-when-cross-origin",
                                body: JSON.stringify({
                                    prompt: selectedText,
                                    languageFrom: "Java",
                                    languageTo: "Kotlin"
                                }),
                                method: "POST",
                                mode: "cors",
                                credentials: "include"
                            });
                            
                            const text = await apiResponse.text();
                            try {
                                const data = JSON.parse(text);
                                console.log(data);
                            } catch (error) {
                                console.log(text);
                            }
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