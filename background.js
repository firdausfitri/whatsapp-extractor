
// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('WhatsApp Phone Extractor installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('web.whatsapp.com')) {
    chrome.action.openPopup();
  } else {
    chrome.tabs.create({url: 'https://web.whatsapp.com'});
  }
});