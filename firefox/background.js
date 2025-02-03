browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "codeConverter",
    title: "Convert Code",
    contexts: ["all"]
  });
  });
  
  browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "codeConverter") {
    browser.browserAction.openPopup();
  }
  });