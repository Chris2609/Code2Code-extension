chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "codeConverter",
      title: "Convert Code",
      contexts: ["all"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "codeConverter") {
      chrome.action.openPopup();
    }
  });