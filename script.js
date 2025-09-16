document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const outputSection = document.querySelector('.output-section');
    const cleanBtn = document.getElementById('clean-btn');
    const copyBtn = document.getElementById('copy-btn');
    const editedBadge = document.getElementById('edited-badge');
    const copiedBadge = document.getElementById('copied-badge');
    
    const historySection = document.getElementById('history-section');
    const historyToggle = document.getElementById('history-toggle');
    const historyContent = document.getElementById('history-content');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    
    const aboutSection = document.getElementById('about-section');
    const aboutToggle = document.getElementById('about-toggle');
    const aboutContent = aboutSection.querySelector('.tui-panel-content');
    
    const HISTORY_KEY = 'clean-clode-history';
    const HISTORY_ENABLED_KEY = 'clean-clode-history-enabled';
    const ABOUT_VISIBLE_KEY = 'clean-clode-about-visible';
    const FIRST_USE_KEY = 'clean-clode-first-use';

    let lastCleanedInput = '';
    let lastCleanedOutput = '';

    console.log('%c█▀▀ █░░ █▀▀ █▀█ █▄░█   █▀▀ █░░ █▀█ █▀▄ █▀▀\n' +
                '█▄▄ █▄▄ ██▄ █▀█ █░▀█   █▄▄ █▄▄ █▄█ █▄▀ ██▄', 
                'color: #00ff41; font-family: monospace');
    console.log('Clean Clode v1.0 | github.com/TheJoWo/Clean-Clode');

    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    async function autoCopyToClipboard(text) {
        if (isMobile()) {
            return;
        }
        
        if (isSafari()) {
            return;
        }
        
        if (!window.isSecureContext) {
            return;
        }
        
        try {
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                showCopiedStatus();
                return;
            }
        } catch (err) {
        }
        
        try {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = text;
            tempTextarea.style.position = 'fixed';
            tempTextarea.style.left = '-9999px';
            tempTextarea.style.top = '-9999px';
            document.body.appendChild(tempTextarea);
            
            tempTextarea.focus();
            tempTextarea.select();
            
            const success = document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            
            if (success) {
                showCopiedStatus();
            }
        } catch (fallbackErr) {
        }
    }

    function showCopiedStatus() {
        copiedBadge.style.display = 'inline-block';
        setTimeout(() => {
            copiedBadge.style.display = 'none';
        }, 3000);
    }

    function isHistoryEnabled() {
        const enabled = localStorage.getItem(HISTORY_ENABLED_KEY);
        return enabled === null ? true : enabled === 'true';
    }

    function isAboutVisible() {
        const visible = localStorage.getItem(ABOUT_VISIBLE_KEY);
        return visible === null ? true : visible === 'true';
    }

    function isFirstUse() {
        const firstUse = localStorage.getItem(FIRST_USE_KEY);
        return firstUse === null ? true : firstUse === 'true';
    }

    function markFirstUseComplete() {
        localStorage.setItem(FIRST_USE_KEY, 'false');
    }

    function toggleAboutSection() {
        const currentlyVisible = isAboutVisible();
        const newVisibility = !currentlyVisible;
        
        localStorage.setItem(ABOUT_VISIBLE_KEY, newVisibility.toString());
        updateAboutSectionDisplay();
        
    }

    function updateAboutSectionDisplay() {
        const visible = isAboutVisible();
        const footerSponsor = document.getElementById('footer-sponsor');
        
        if (visible) {
            aboutContent.style.display = 'block';
            aboutToggle.textContent = '[ HIDE ]';
            if (footerSponsor) {
                footerSponsor.style.display = 'none';
            }
        } else {
            aboutContent.style.display = 'none';
            aboutToggle.textContent = '[ SHOW ]';
            if (footerSponsor) {
                footerSponsor.style.display = 'block';
            }
        }
    }

    function toggleHistory() {
        const currentlyEnabled = isHistoryEnabled();
        const willEnable = !currentlyEnabled;
        
        const message = willEnable 
            ? 'Enable paste history? Your cleaned text will be stored locally on this device.'
            : 'Disable paste history? This will permanently delete all existing history and stop saving new items.';
            
        if (!confirm(message)) {
            return;
        }
        
        if (!willEnable) {
            try {
                localStorage.removeItem(HISTORY_KEY);
            } catch (error) {
            }
        }
        
        localStorage.setItem(HISTORY_ENABLED_KEY, willEnable.toString());
        updateHistoryUI();
        updateHistoryDisplay();
        updateHistoryVisibility();
        
    }

    function updateHistoryUI() {
        const enabled = isHistoryEnabled();
        historyToggle.textContent = enabled ? '[ ON ]' : '[ TURN ON ]';
        historyToggle.classList.toggle('enabled', enabled);
        historyToggle.classList.toggle('disabled', !enabled);
    }

    function getHistory() {
        try {
            const history = localStorage.getItem(HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            return [];
        }
    }

    function saveToHistory(cleanedText, originalText) {
        if (!isHistoryEnabled() || !cleanedText.trim()) {
            return;
        }

        // Prevent duplicate history items when the same input/output is processed again
        if (originalText === lastCleanedInput && cleanedText === lastCleanedOutput) {
            return;
        }

        try {
            const history = getHistory();
            const newItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                cleaned: cleanedText,
                original: originalText || '',
                preview: cleanedText.substring(0, 100) + (cleanedText.length > 100 ? '...' : '')
            };

            history.unshift(newItem);

            const trimmedHistory = history.slice(0, 50);

            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));

            // Update tracking variables
            lastCleanedInput = originalText;
            lastCleanedOutput = cleanedText;

            showHistorySection();

            updateHistoryDisplay();
        } catch (error) {
        }
    }

    function updateHistoryVisibility() {
        const history = getHistory();
        const enabled = isHistoryEnabled();
        
        if (history.length > 0) {
            historySection.style.display = 'block';
            
            if (enabled) {
                historyContent.style.display = 'block';
            } else {
                historyContent.style.display = 'none';
            }
        } else {
            historySection.style.display = 'none';
        }
    }

    function showHistorySection() {
        updateHistoryVisibility();
    }


    function deleteHistoryItem(itemId) {
        try {
            const history = getHistory();
            const filteredHistory = history.filter(item => item.id !== itemId);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
            updateHistoryDisplay();
            updateHistoryVisibility();
        } catch (error) {
        }
    }

    function clearHistory() {
        try {
            localStorage.removeItem(HISTORY_KEY);
            updateHistoryDisplay();
            updateHistoryVisibility();
        } catch (error) {
        }
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    function createHistoryDeleteButton(itemId) {
        const btn = document.createElement('button');
        btn.className = 'tui-button tui-bg-red-black history-delete-btn';
        btn.textContent = '[ DELETE ]';

        btn.addEventListener('click', function() {
            if (confirm('Delete this history item? This cannot be undone.')) {
                deleteHistoryItem(itemId);
            }
        });

        return btn;
    }

    function createHistoryCopyButton(text) {
        const btn = document.createElement('button');
        btn.className = 'tui-button tui-bg-green-black history-copy-btn';
        btn.textContent = '[ COPY ]';

        btn.addEventListener('click', async function() {
            const originalText = btn.textContent;
            btn.textContent = '[ ... ]';
            btn.disabled = true;

            try {
                if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const tempTextarea = document.createElement('textarea');
                    tempTextarea.value = text;
                    tempTextarea.style.position = 'fixed';
                    tempTextarea.style.left = '-9999px';
                    document.body.appendChild(tempTextarea);
                    tempTextarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempTextarea);
                }

                btn.textContent = '[ ✓ ]';
                btn.classList.add('copied');

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('copied');
                    btn.disabled = false;
                }, 2000);

            } catch (error) {
                btn.textContent = '[ X ]';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        });

        return btn;
    }

    function makePreviewClickable(previewDiv, fullContentDiv) {
        let isExpanded = false;
        
        previewDiv.style.cursor = 'pointer';
        previewDiv.title = 'Click to expand';
        
        previewDiv.addEventListener('click', function() {
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                previewDiv.style.display = 'none';
                fullContentDiv.style.display = 'block';
                
                fullContentDiv.style.cursor = 'pointer';
                fullContentDiv.title = 'Click to collapse';
                
                const collapseHandler = function() {
                    previewDiv.style.display = 'block';
                    fullContentDiv.style.display = 'none';
                    fullContentDiv.removeEventListener('click', collapseHandler);
                };
                
                fullContentDiv.addEventListener('click', collapseHandler);
            }
        });
    }

    function updateHistoryDisplay() {
        const history = getHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="tui-text tui-color-green">[No history yet - start cleaning some text!]</p>';
            return;
        }

        historyList.innerHTML = '';
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const header = document.createElement('div');
            header.className = 'history-item-header';
            
            const date = document.createElement('span');
            date.className = 'history-date tui-text';
            date.textContent = formatDate(item.timestamp);
            
            const controls = document.createElement('div');
            controls.className = 'history-item-controls';

            const deleteBtn = createHistoryDeleteButton(item.id);
            const copyBtn = createHistoryCopyButton(item.cleaned);
            controls.appendChild(deleteBtn);
            controls.appendChild(copyBtn);
            
            header.appendChild(date);
            header.appendChild(controls);
            
            const contentContainer = document.createElement('div');
            contentContainer.className = 'history-item-content-container';
            
            const lines = item.cleaned.split('\n');
            const isLong = lines.length > 5;
            const previewText = isLong 
                ? lines.slice(0, 5).join('\n') + '...'
                : item.cleaned;
            
            const previewDiv = document.createElement('div');
            previewDiv.className = 'history-item-content history-item-preview';
            previewDiv.textContent = previewText;
            
            const fullContentDiv = document.createElement('div');
            fullContentDiv.className = 'history-item-content history-item-full';
            fullContentDiv.textContent = item.cleaned;
            fullContentDiv.style.display = isLong ? 'none' : 'block';
            
            if (isLong) {
                previewDiv.style.display = 'block';
                
                makePreviewClickable(previewDiv, fullContentDiv);
            } else {
                previewDiv.style.display = 'none';
            }
            
            contentContainer.appendChild(previewDiv);
            contentContainer.appendChild(fullContentDiv);
            
            historyItem.appendChild(header);
            historyItem.appendChild(contentContainer);
            historyList.appendChild(historyItem);
        });
    }

    function updateOutputVisibility() {
        const hasContent = outputText.value.trim();
        const container = document.querySelector('.tui-container');
        
        if (hasContent) {
            outputSection.classList.add('has-content');
            container.classList.add('has-output');
        } else {
            outputSection.classList.remove('has-content');
            container.classList.remove('has-output');
        }
    }

    function performCleanup() {
        const inputValue = inputText.value;
        
        if (!inputValue.trim()) {
            outputText.placeholder = '[ERROR: NO INPUT DETECTED]';
            setTimeout(() => {
                outputText.placeholder = '[OUTPUT READY FOR DISPLAY...]';
            }, 2000);
            return;
        }
        
        cleanBtn.textContent = '[ PROCESSING... ]';
        cleanBtn.disabled = true;
        
        setTimeout(() => {
            const cleanedValue = detectAndClean(inputValue);
            
            outputText.value = cleanedValue;
            updateOutputVisibility();
            
            saveToHistory(cleanedValue, inputValue);
            
            if (isFirstUse()) {
                markFirstUseComplete();
                localStorage.setItem(ABOUT_VISIBLE_KEY, 'false');
                updateAboutSectionDisplay();
            }
            
            editedBadge.style.display = 'none';
            copiedBadge.style.display = 'none';
            
            copyBtn.disabled = !cleanedValue;
            
            if (copyBtn.classList.contains('copied')) {
                copyBtn.textContent = '[ COPY ]';
                copyBtn.classList.remove('copied');
            }
            
            cleanBtn.textContent = '[ Clean My Clode ]';
            cleanBtn.disabled = false;
            
            if (cleanedValue) {
                autoCopyToClipboard(cleanedValue);
                
            }
            
        }, 500);
    }

    function cleanLLMText(input) {
        return input
            .replace(
                /([^\n])\n(?!\s*([\-*•●⏺▶▪◦]|\d+\.|[A-Z][a-z]|[📌🎯📋📖✨✅❌⭐🔥👉➡️]|$))/g,
                '$1 '
            )
            .replace(/[ \t]+/g, ' ')
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function cleanGitDiff(input) {
        return input
            .replace(/[│┃╏╎|▌]+/g, '')
            .replace(/([^\n])\n(?!\s*(\d+\s*[+-]\s*|[\-*•●⏺▶▪◦]|\d+\.|[A-Z][a-z]|[📌🎯📋📖✨✅❌⭐🔥👉➡️]|^\s*$|$))/g, '$1 ')
            .replace(/[ \t]+/g, ' ')
            .split('\n')
            .map(line => {
                const trimmed = line.trim();
                if (trimmed === '') {
                    return '';
                }
                if (/^\d+\s*[+-]/.test(trimmed)) {
                    return trimmed;
                }
                return trimmed;
            })
            .join('\n')
            .replace(/\n{4,}/g, '\n\n\n')
            .trim();
    }

    function cleanClaudeDump(input) {
        return input
            .replace(/[│┃╏╎|▌]+/g, '')
            .replace(/ {2,}/g, ' ')
            .replace(/([^\n])\n(?!\s*([\-*•●⏺▶▪◦]|\d+\.|[A-Z][a-z]|[📌🎯📋📖✨✅❌⭐🔥👉➡️]|$))/g, '$1 ')
            .replace(/([a-z,:])\s*\n\s*([a-z])/g, '$1 $2')
            .replace(/[ \t]+/g, ' ')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function detectAndClean(input) {
        if (!input.trim()) {
            return '';
        }

        if (/^\s*\d+\s*[+-]\s/m.test(input)) {
            return cleanGitDiff(input);
        }

        if (/[│┃╏╎▌]/.test(input) || /\|/.test(input)) {
            return cleanClaudeDump(input);
        }

        const codeScore = (input.match(/[{}();=]/g) || []).length;
        const lineCount = input.split('\n').length;
        if (lineCount > 0 && codeScore / lineCount > 0.5) {
            return input.trim(); // leave code mostly untouched
        }

        return cleanLLMText(input);
    }

    cleanBtn.addEventListener('click', performCleanup);
    
    copyBtn.addEventListener('click', async function() {
        const textToCopy = outputText.value;
        copyBtn.textContent = '[ COPYING... ]';
        copyBtn.disabled = true;
        
        let success = false;
        
        try {
            if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
                success = true;
            }
        } catch (err) {
        }
        
        if (!success) {
            try {
                const tempTextarea = document.createElement('textarea');
                tempTextarea.value = textToCopy;
                tempTextarea.style.position = 'fixed';
                tempTextarea.style.left = '-9999px';
                tempTextarea.style.top = '-9999px';
                document.body.appendChild(tempTextarea);
                
                tempTextarea.focus();
                tempTextarea.select();
                
                success = document.execCommand('copy');
                document.body.removeChild(tempTextarea);
                
                if (success) {
                }
            } catch (fallbackErr) {
            }
        }
        
        if (success) {
            copyBtn.textContent = '[ COPIED! ]';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.textContent = '[ COPY ]';
                copyBtn.classList.remove('copied');
                copyBtn.disabled = false;
            }, 2000);
        } else {
            copyBtn.textContent = '[ FAILED ]';
            setTimeout(() => {
                copyBtn.textContent = '[ COPY ]';
                copyBtn.disabled = false;
            }, 2000);
        }
    });

    inputText.addEventListener('paste', function() {
        setTimeout(() => {
            if (inputText.value.trim()) {
                performCleanup();
            }
        }, 50);
    });

    inputText.addEventListener('input', function() {
        copyBtn.disabled = true;
        copyBtn.textContent = '[ COPY ]';
        copyBtn.classList.remove('copied');
        outputText.value = '';
        editedBadge.style.display = 'none';
        copiedBadge.style.display = 'none';
        updateOutputVisibility();

        // Reset duplicate tracking when input changes
        lastCleanedInput = '';
        lastCleanedOutput = '';

        if (inputText.value.trim()) {
            outputText.placeholder = '[READY FOR PROCESSING...]';
        } else {
            outputText.placeholder = '[OUTPUT READY FOR DISPLAY...]';
        }
    });

    outputText.addEventListener('input', function() {
        updateOutputVisibility();
        
        copyBtn.disabled = !outputText.value.trim();
        
        if (outputText.value.trim()) {
            editedBadge.style.display = 'inline-block';
        } else {
            editedBadge.style.display = 'none';
        }
        
        copiedBadge.style.display = 'none';
        
        if (copyBtn.classList.contains('copied')) {
            copyBtn.textContent = '[ COPY ]';
            copyBtn.classList.remove('copied');
        }
    });

    inputText.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            cleanBtn.click();
        }
    });
    
    let typingTimer;
    inputText.addEventListener('input', function() {
        clearTimeout(typingTimer);
        
        inputText.classList.add('typing-active');
        
        typingTimer = setTimeout(() => {
            inputText.classList.remove('typing-active');
        }, 200);
    });

    updateOutputVisibility();
    
    historyToggle.addEventListener('click', toggleHistory);
    
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('Clear all history? This cannot be undone.')) {
            clearHistory();
        }
    });
    
    aboutToggle.addEventListener('click', toggleAboutSection);
    
    updateHistoryUI();
    updateHistoryDisplay();
    
    updateHistoryVisibility();
    
    updateAboutSectionDisplay();
    
    if (isSafari() && !isMobile()) {
        copyBtn.classList.add('safari-user');
    }
    
    inputText.focus();
});
