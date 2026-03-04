const API_URL = 'http://localhost:8001';

// Task tracking
let currentTasks = {
    translateText: null,
    summarizeText: null,
    rewriteText: null,
    translateFile: null,
    summarizeFile: null,
    rewriteFile: null
};

// Abort controllers for cancellation
let abortControllers = {
    translateText: null,
    summarizeText: null,
    rewriteText: null,
    translateFile: null,
    summarizeFile: null,
    rewriteFile: null
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modelSelect = document.getElementById('model-select');
    const timeoutSelect = document.getElementById('timeout-select');
    const languageSelect = document.getElementById('language-select');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Text Translation Elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const translateTextBtn = document.getElementById('translate-text-btn');
    const summarizeTextBtn = document.getElementById('summarize-text-btn');
    const rewriteTextBtn = document.getElementById('rewrite-text-btn');
    const stopTranslateTextBtn = document.getElementById('stop-translate-text-btn');
    const stopSummarizeTextBtn = document.getElementById('stop-summarize-text-btn');
    const stopRewriteTextBtn = document.getElementById('stop-rewrite-text-btn');
    const sourceLangText = document.getElementById('source-lang-text');
    const targetLangText = document.getElementById('target-lang-text');
    const charCount = document.querySelector('.char-count');
    const copyBtn = document.querySelector('.copy-btn');

    // File Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const filenameDisplay = document.getElementById('filename');
    const removeFileBtn = document.getElementById('remove-file');
    const translateFileBtn = document.getElementById('translate-file-btn');
    const summarizeFileBtn = document.getElementById('summarize-file-btn');
    const rewriteFileBtn = document.getElementById('rewrite-file-btn');
    const stopTranslateFileBtn = document.getElementById('stop-translate-file-btn');
    const stopSummarizeFileBtn = document.getElementById('stop-summarize-file-btn');
    const stopRewriteFileBtn = document.getElementById('stop-rewrite-file-btn');
    const sourceLangFile = document.getElementById('source-lang-file');
    const targetLangFile = document.getElementById('target-lang-file');

    let currentFile = null;

    // Initialize
    fetchModels();
    initializeCollapsableSections();

    // Language Selection
    languageSelect.value = i18n.getLanguage();
    languageSelect.addEventListener('change', (e) => {
        i18n.setLanguage(e.target.value);
        updateDynamicMessages();
    });

    // Listen for language changes from other tabs
    window.addEventListener('languageChanged', () => {
        languageSelect.value = i18n.getLanguage();
    });

    // Modal Elements
    const logo = document.querySelector('.logo');
    const modal = document.getElementById('gustave-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalBody = document.getElementById('modal-body');

    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Close Modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Character Count
    inputText.addEventListener('input', () => {
        charCount.textContent = `${inputText.value.length} ${i18n.getText('textTab.charCount')}`;
    });

    // Stop button handlers
    stopTranslateTextBtn.addEventListener('click', () => cancelTask('translateText'));
    stopSummarizeTextBtn.addEventListener('click', () => cancelTask('summarizeText'));
    stopRewriteTextBtn.addEventListener('click', () => cancelTask('rewriteText'));
    stopTranslateFileBtn.addEventListener('click', () => cancelTask('translateFile'));
    stopSummarizeFileBtn.addEventListener('click', () => cancelTask('summarizeFile'));
    stopRewriteFileBtn.addEventListener('click', () => cancelTask('rewriteFile'));

    // Translate Text
    translateTextBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) return;

        showStopButton('translateText', translateTextBtn, stopTranslateTextBtn);
        setLoading(translateTextBtn, true, i18n.getText('messages.translating'));

        try {
            abortControllers.translateText = new AbortController();
            const response = await fetch(`${API_URL}/translate/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    source_lang: sourceLangText.value,
                    target_lang: targetLangText.value,
                    model: modelSelect.value
                }),
                signal: abortControllers.translateText.signal
            });

            if (!response.ok) throw new Error('Translation failed');
            const data = await response.json();
            currentTasks.translateText = data.task_id;
            outputText.textContent = data.translation;

            showMetrics(data, 'translation');
        } catch (error) {
            if (error.name === 'AbortError') {
                outputText.textContent = i18n.getText('messages.translationCancelled');
            } else {
                handleError(error);
            }
        } finally {
            hideStopButton('translateText', translateTextBtn, stopTranslateTextBtn);
            setLoading(translateTextBtn, false);
        }
    });

    // Summarize Text
    summarizeTextBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) return;

        showStopButton('summarizeText', summarizeTextBtn, stopSummarizeTextBtn);
        setLoading(summarizeTextBtn, true, i18n.getText('messages.summarizing'));

        try {
            abortControllers.summarizeText = new AbortController();
            const response = await fetch(`${API_URL}/summarize/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    model: modelSelect.value,
                    target_lang: targetLangText.value
                }),
                signal: abortControllers.summarizeText.signal
            });

            if (!response.ok) throw new Error('Summarization failed');
            const data = await response.json();
            currentTasks.summarizeText = data.task_id;
            outputText.textContent = data.summary;

            showMetrics(data, 'summary');
        } catch (error) {
            if (error.name === 'AbortError') {
                outputText.textContent = i18n.getText('messages.summarizationCancelled');
            } else {
                handleError(error);
            }
        } finally {
            hideStopButton('summarizeText', summarizeTextBtn, stopSummarizeTextBtn);
            setLoading(summarizeTextBtn, false);
        }
    });

    // Rewrite Text
    rewriteTextBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) return;

        showStopButton('rewriteText', rewriteTextBtn, stopRewriteTextBtn);
        setLoading(rewriteTextBtn, true, i18n.getText('messages.rewriting'));

        try {
            abortControllers.rewriteText = new AbortController();
            const response = await fetch(`${API_URL}/rewrite/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    model: modelSelect.value,
                    target_lang: targetLangText.value
                }),
                signal: abortControllers.rewriteText.signal
            });

            if (!response.ok) throw new Error('Rewriting failed');
            const data = await response.json();
            currentTasks.rewriteText = data.task_id;
            outputText.textContent = data.rewritten;

            showMetrics(data, 'rewrite');
        } catch (error) {
            if (error.name === 'AbortError') {
                outputText.textContent = i18n.getText('messages.rewritingCancelled');
            } else {
                handleError(error);
            }
        } finally {
            hideStopButton('rewriteText', rewriteTextBtn, stopRewriteTextBtn);
            setLoading(rewriteTextBtn, false);
        }
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (outputText.textContent) {
            navigator.clipboard.writeText(outputText.textContent);
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = originalIcon, 2000);
        }
    });

    // File Upload
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        dropZone.style.display = 'block';
        translateFileBtn.disabled = true;
        summarizeFileBtn.disabled = true;
        rewriteFileBtn.disabled = true;
    });

    // Translate File
    translateFileBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        showStopButton('translateFile', translateFileBtn, stopTranslateFileBtn);
        setLoading(translateFileBtn, true, i18n.getText('messages.translating'));
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('source_lang', sourceLangFile.value);
        formData.append('target_lang', targetLangFile.value);
        formData.append('model', modelSelect.value);
        formData.append('timeout', timeoutSelect.value);

        try {
            abortControllers.translateFile = new AbortController();
            const response = await fetch(`${API_URL}/translate/file`, {
                method: 'POST',
                body: formData,
                signal: abortControllers.translateFile.signal
            });

            if (!response.ok) throw new Error('File translation failed');

            // Get filename from Content-Disposition header
            let filename = `translated_${currentFile.name}`;
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Fallback: if original was PDF, ensure output is DOCX
            if (currentFile.name.toLowerCase().endsWith('.pdf') && !filename.toLowerCase().endsWith('.docx')) {
                filename = filename.replace(/\.pdf$/i, '.docx');
            }

            const blob = await response.blob();
            downloadFile(blob, filename);
            alert(i18n.getText('messages.fileTranslatedSuccess'));
        } catch (error) {
            if (error.name === 'AbortError') {
                alert(i18n.getText('messages.translationCancelled'));
            } else {
                alert('Error: ' + error.message);
            }
        } finally {
            hideStopButton('translateFile', translateFileBtn, stopTranslateFileBtn);
            setLoading(translateFileBtn, false);
        }
    });

    // Summarize File
    summarizeFileBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        showStopButton('summarizeFile', summarizeFileBtn, stopSummarizeFileBtn);
        setLoading(summarizeFileBtn, true, i18n.getText('messages.summarizing'));

        try {
            const formData = new FormData();
            formData.append('file', currentFile);
            formData.append('model', modelSelect.value);
            formData.append('target_lang', targetLangFile.value);
            formData.append('timeout', timeoutSelect.value);

            abortControllers.summarizeFile = new AbortController();
            const response = await fetch(`${API_URL}/summarize/file`, {
                method: 'POST',
                body: formData,
                signal: abortControllers.summarizeFile.signal
            });

            if (!response.ok) throw new Error('File summarization failed');
            const data = await response.json();

            alert(`${i18n.getText('messages.summary')}:\n${data.summary}\n\n${i18n.getText('messages.metrics')}:\n- ${i18n.getText('messages.originalWords')}: ${data.original_word_count} words\n- ${i18n.getText('messages.summaryWords')}: ${data.summary_word_count} words\n- ${i18n.getText('messages.compression')}: ${data.compression_ratio}%\n- ${i18n.getText('messages.duration')}: ${data.duration}s`);
        } catch (error) {
            if (error.name === 'AbortError') {
                alert(i18n.getText('messages.summarizationCancelled'));
            } else {
                alert('Error: ' + error.message);
            }
        } finally {
            hideStopButton('summarizeFile', summarizeFileBtn, stopSummarizeFileBtn);
            setLoading(summarizeFileBtn, false);
        }
    });

    // Rewrite File
    rewriteFileBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        showStopButton('rewriteFile', rewriteFileBtn, stopRewriteFileBtn);
        setLoading(rewriteFileBtn, true, i18n.getText('messages.rewriting'));

        try {
            const formData = new FormData();
            formData.append('file', currentFile);
            formData.append('model', modelSelect.value);
            formData.append('target_lang', targetLangFile.value);
            formData.append('timeout', timeoutSelect.value);

            abortControllers.rewriteFile = new AbortController();
            const response = await fetch(`${API_URL}/rewrite/file`, {
                method: 'POST',
                body: formData,
                signal: abortControllers.rewriteFile.signal
            });

            if (!response.ok) throw new Error('File rewriting failed');
            const data = await response.json();

            alert(`${i18n.getText('messages.rewrittenText')}:\n${data.rewritten}\n\n${i18n.getText('messages.metrics')}:\n- ${i18n.getText('messages.originalWords')}: ${data.original_word_count} words\n- ${i18n.getText('messages.rewrittenWords')}: ${data.rewritten_word_count} words\n- ${i18n.getText('messages.duration')}: ${data.duration}s`);
        } catch (error) {
            if (error.name === 'AbortError') {
                alert(i18n.getText('messages.rewritingCancelled'));
            } else {
                alert('Error: ' + error.message);
            }
        } finally {
            hideStopButton('rewriteFile', rewriteFileBtn, stopRewriteFileBtn);
            setLoading(rewriteFileBtn, false);
        }
    });

    // Helper Functions
    function handleFile(file) {
        const validTypes = ['.docx', '.pdf', '.txt', '.html'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        if (validTypes.includes(ext)) {
            currentFile = file;
            filenameDisplay.textContent = file.name;
            fileInfo.classList.remove('hidden');
            dropZone.style.display = 'none';
            translateFileBtn.disabled = false;
            summarizeFileBtn.disabled = false;
            rewriteFileBtn.disabled = false;
        } else {
            alert(i18n.getText('messages.invalidFileType'));
        }
    }

    function downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    function showMetrics(data, type) {
        const metricsDiv = document.getElementById('translation-metrics');
        if (!metricsDiv || !data.duration) return;

        let html = `<i class="fa-solid fa-gauge-high"></i><span>${data.duration}s</span><span class="separator">•</span>`;

        if (type === 'translation') {
            html += `<span>${data.word_count} words</span><span class="separator">•</span><span>${data.words_per_second} words/sec</span>`;
        } else if (type === 'summary') {
            html += `<span>${data.original_word_count} → ${data.summary_word_count} words</span><span class="separator">•</span><span>${data.compression_ratio}% compression</span>`;
        } else if (type === 'rewrite') {
            html += `<span>${data.original_word_count} → ${data.rewritten_word_count} words</span>`;
        }

        metricsDiv.innerHTML = html;
        metricsDiv.style.display = 'flex';
    }

    function handleError(error) {
        console.error(error);
        outputText.textContent = 'Error: ' + error.message;
        const metricsDiv = document.getElementById('translation-metrics');
        if (metricsDiv) metricsDiv.style.display = 'none';
    }

    async function fetchModels() {
        try {
            const response = await fetch(`${API_URL}/models`);
            const data = await response.json();

            modelSelect.innerHTML = '';
            if (data.models && data.models.length > 0) {
                // Filtrer les modèles selon les critères :
                // - Inclure : commence par "gemma" ou "deepseek" OU contient "trans"
                // - Exclure : contient "coder"
                const filteredModels = data.models.filter(model => {
                    const modelName = model.name.toLowerCase();

                    // Exclure tout modèle contenant "coder"
                    if (modelName.includes('code')) {
                        return false;
                    }

                    // Inclure si commence par "gemma" ou "deepseek" ou contient "trans"
                    return modelName.startsWith('gemma') ||
                        modelName.startsWith('deepseek') ||
                        modelName.startsWith('mistral') ||
                        modelName.startsWith('ministral') ||
                        modelName.startsWith('llama3') ||
                        modelName.startsWith('qwuen3') ||
                        modelName.includes('trans');
                });

                if (filteredModels.length > 0) {
                    filteredModels.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.name;
                        option.textContent = model.name;
                        modelSelect.appendChild(option);
                    });
                } else {
                    modelSelect.innerHTML = '<option value="llama3">llama3 (Default)</option>';
                }
            } else {
                modelSelect.innerHTML = '<option value="llama3">llama3 (Default)</option>';
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            modelSelect.innerHTML = '<option value="llama3">llama3 (Default)</option>';
        }
    }

    function initializeCollapsableSections() {
        document.querySelectorAll('.help-section').forEach(section => {
            const header = section.querySelector('.help-header');
            if (header) {
                header.addEventListener('click', () => section.classList.toggle('collapsed'));
            }
        });
    }

    function setLoading(btn, loading, message = 'Processing...') {
        if (loading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${message}`;
            btn.disabled = true;
        } else {
            btn.innerHTML = btn.dataset.originalText;
            btn.disabled = false;
        }
    }

    function showStopButton(taskType, actionBtn, stopBtn) {
        actionBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
    }

    function hideStopButton(taskType, actionBtn, stopBtn) {
        stopBtn.style.display = 'none';
        actionBtn.style.display = 'flex';
        currentTasks[taskType] = null;
        abortControllers[taskType] = null;
    }

    async function cancelTask(taskType) {
        // Abort the fetch request
        if (abortControllers[taskType]) {
            abortControllers[taskType].abort();
        }

        // Call backend cancel endpoint if we have a task ID
        if (currentTasks[taskType]) {
            try {
                await fetch(`${API_URL}/cancel/${currentTasks[taskType]}`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Error cancelling task:', error);
            }
        }
    }

    function updateDynamicMessages() {
        // Update the character count display format
        const charCountEl = document.querySelector('.char-count');
        if (charCountEl && inputText.value.length === 0) {
            charCountEl.textContent = `0 ${i18n.getText('textTab.charCount')}`;
        }
    }
});
