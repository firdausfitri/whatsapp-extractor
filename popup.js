
document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const actionButtons = document.getElementById('actionButtons');
  const phoneList = document.getElementById('phoneList');
  const stats = document.getElementById('stats');
  
  let extractedNumbers = [];

  extractBtn.addEventListener('click', extractPhoneNumbers);
  document.getElementById('copyAllBtn').addEventListener('click', copyAllNumbers);
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  document.getElementById('clearBtn').addEventListener('click', clearResults);
  document.getElementById('refreshBtn').addEventListener('click', extractPhoneNumbers);

  async function extractPhoneNumbers() {
    try {
      // Check if we're on WhatsApp Web
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tab.url.includes('web.whatsapp.com')) {
        alert('Please open WhatsApp Web first!');
        return;
      }

      showLoading(true);
      extractBtn.disabled = true;

      // Inject extraction script
      const results = await chrome.tabs.sendMessage(tab.id, {action: 'extractNumbers'});
      
      if (results && results.success) {
        extractedNumbers = results.numbers;
        displayResults();
      } else {
        throw new Error(results?.error || 'Failed to extract numbers');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      alert('Error extracting numbers. Make sure WhatsApp Web is loaded completely.');
    } finally {
      showLoading(false);
      extractBtn.disabled = false;
    }
  }

  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    results.style.display = show ? 'none' : (extractedNumbers.length > 0 ? 'block' : 'none');
    actionButtons.style.display = show ? 'none' : (extractedNumbers.length > 0 ? 'block' : 'none');
  }

  function displayResults() {
    if (extractedNumbers.length === 0) {
      phoneList.innerHTML = '<p style="text-align: center; color: #ffc107;">No phone numbers found</p>';
      stats.textContent = 'Try scrolling through your chat list first';
      results.style.display = 'block';
      return;
    }

    stats.textContent = `Found ${extractedNumbers.length} unique phone numbers`;
    
    phoneList.innerHTML = extractedNumbers.map((number, index) => `
      <div class="phone-item">
        <span>${number}</span>
        <button class="copy-btn" data-number="${number}">Copy</button>
      </div>
    `).join('');

    // Add copy functionality to individual buttons
    phoneList.addEventListener('click', function(e) {
      if (e.target.classList.contains('copy-btn')) {
        const number = e.target.getAttribute('data-number');
        copyToClipboard(number);
      }
    });

    results.style.display = 'block';
    actionButtons.style.display = 'block';
  }

  function copyAllNumbers() {
    const text = extractedNumbers.join('\n');
    copyToClipboard(text, `Copied ${extractedNumbers.length} numbers!`);
  }

  function copyToClipboard(text, successMsg = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      // Show temporary feedback
      const originalText = extractBtn.textContent;
      extractBtn.textContent = successMsg;
      setTimeout(() => {
        extractBtn.textContent = originalText;
      }, 1500);
    });
  }

  function exportToCSV() {
    const csv = 'Phone Number\n' + extractedNumbers.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `whatsapp_numbers_${new Date().toISOString().slice(0,10)}.csv`,
      saveAs: true
    });
    
    URL.revokeObjectURL(url);
  }

  function clearResults() {
    extractedNumbers = [];
    results.style.display = 'none';
    actionButtons.style.display = 'none';
  }
});
