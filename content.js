
// Content script that runs on WhatsApp Web
(function() {
  'use strict';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractNumbers') {
      try {
        const numbers = extractPhoneNumbers();
        sendResponse({success: true, numbers: numbers});
      } catch (error) {
        sendResponse({success: false, error: error.message});
      }
    }
    return true; // Keep message channel open
  });

  function extractPhoneNumbers() {
    const phoneNumbers = new Set();
    
    // Multiple extraction methods
    const extractionMethods = [
      extractFromChatList,
      extractFromAllText,
      extractFromAttributes,
      extractFromAriaLabels
    ];

    extractionMethods.forEach(method => {
      try {
        const numbers = method();
        numbers.forEach(num => phoneNumbers.add(num));
      } catch (e) {
        console.log('Extraction method failed:', e);
      }
    });

    // Convert to array and format
    const numbersArray = Array.from(phoneNumbers)
      .map(formatPhoneNumber)
      .filter(num => isValidPhoneNumber(num))
      .sort();

    return [...new Set(numbersArray)]; // Remove duplicates again after formatting
  }

  function extractFromChatList() {
    const numbers = [];
    
    // Try various selectors for chat items
    const chatSelectors = [
      '[data-testid*="cell-frame"]',
      '[data-testid*="chat"]',
      '.zoWT4', // Common WhatsApp class
      '[role="listitem"]',
      '._2nY6O', // Another common class
      '.copyable-text'
    ];

    chatSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const text = getElementText(element);
        const foundNumbers = extractNumbersFromText(text);
        numbers.push(...foundNumbers);
      });
    });

    return numbers;
  }

  function extractFromAllText() {
    const numbers = [];
    const allText = document.body.innerText || document.body.textContent || '';
    return extractNumbersFromText(allText);
  }

  function extractFromAttributes() {
    const numbers = [];
    const elementsWithTitle = document.querySelectorAll('[title*="+"]');
    
    elementsWithTitle.forEach(el => {
      const title = el.getAttribute('title');
      if (title) {
        const foundNumbers = extractNumbersFromText(title);
        numbers.push(...foundNumbers);
      }
    });

    return numbers;
  }

  function extractFromAriaLabels() {
    const numbers = [];
    const elementsWithAria = document.querySelectorAll('[aria-label*="+"], [data-pre-plain-text*="+"]');
    
    elementsWithAria.forEach(el => {
      const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('data-pre-plain-text') || '';
      const foundNumbers = extractNumbersFromText(ariaLabel);
      numbers.push(...foundNumbers);
    });

    return numbers;
  }

  function getElementText(element) {
    return element.textContent || element.innerText || element.title || 
           element.getAttribute('aria-label') || element.getAttribute('data-pre-plain-text') || '';
  }

  function extractNumbersFromText(text) {
    if (!text) return [];
    
    const patterns = [
      /\+60[\s\-]?\d{1,2}[\s\-]?\d{3,4}[\s\-]?\d{4}/g,  // Malaysian +60
      /\+\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{4}/g, // International
      /60[\s\-]?\d{1,2}[\s\-]?\d{3,4}[\s\-]?\d{4}/g,    // Malaysian without +
      /0\d{1,2}[\s\-]?\d{3,4}[\s\-]?\d{4}/g             // Local Malaysian
    ];

    const foundNumbers = [];
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        foundNumbers.push(...matches);
      }
    });

    return foundNumbers;
  }

  function formatPhoneNumber(number) {
    // Clean the number
    let cleaned = number.replace(/[\s\-]/g, '');
    
    // Convert to international format
    if (cleaned.startsWith('0')) {
      cleaned = '+6' + cleaned; // Malaysian numbers
    } else if (cleaned.startsWith('60') && !cleaned.startsWith('+60')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Format Malaysian numbers nicely
    if (cleaned.match(/^\+60\d{9,11}$/)) {
      return cleaned.replace(/(\+60)(\d{1,2})(\d{3,4})(\d{4})/, '$1 $2-$3 $4');
    }

    return cleaned;
  }

  function isValidPhoneNumber(number) {
    // Basic validation
    return number.match(/^\+\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{4}$/);
  }

  // Add visual indicator when extension is active
  function addExtractorIndicator() {
    if (document.getElementById('whatsapp-extractor-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'whatsapp-extractor-indicator';
    indicator.innerHTML = '📱 Phone Extractor Ready';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #25D366;
      color: white;
      padding: 8px 12px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 9999;
      font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
      indicator.remove();
    }, 3000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addExtractorIndicator);
  } else {
    addExtractorIndicator();
  }

})();
