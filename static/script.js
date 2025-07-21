
// Dark Mode Functionality - Initialize immediately
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const body = document.body;
    const themeIcon = themeToggle.querySelector('.material-symbols-outlined');

    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';

    // Apply the saved theme
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
    } else {
        body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.textContent = 'light_mode';
    }

    // Theme toggle event listener
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            if (themeIcon) themeIcon.textContent = 'dark_mode';
            localStorage.setItem('theme', 'dark');
        } else {
            if (themeIcon) themeIcon.textContent = 'light_mode';
            localStorage.setItem('theme', 'light');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const clarifyButton = document.getElementById('clarifyButton');
    const userInput = document.getElementById('userInput');
    const resultsDiv = document.getElementById('results');
    const outputSection = document.getElementById('outputSection');
    const followupSection = document.getElementById('followupSection');
    const followupResponse = document.getElementById('followupResponse');
    const followupContent = document.getElementById('followupContent');

    // File upload elements
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const removeFile = document.getElementById('removeFile');

    // Tab elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    let selectedFile = null;

    // Global variables
    let currentAnalysis = null;
    let originalText = '';
    let previousAnalysis = '';

    // Tab switching functionality
    if (tabButtons) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;

                // Update tab buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update tab content
                tabContents.forEach(content => content.classList.remove('active'));
                const targetTab = document.getElementById(tabName + 'Tab');
                if (targetTab) targetTab.classList.add('active');

                // Reset file selection when switching to text tab
                if (tabName === 'text') {
                    selectedFile = null;
                    if (filePreview) filePreview.style.display = 'none';
                }

                updateButtonState();
            });
        });
    }

    // File upload functionality
    if (fileUploadArea && fileInput) {
        fileUploadArea.addEventListener('click', () => fileInput.click());

        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelection(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }

    if (removeFile) {
        removeFile.addEventListener('click', () => {
            selectedFile = null;
            if (fileInput) fileInput.value = '';
            if (filePreview) filePreview.style.display = 'none';
            updateButtonState();
        });
    }

    function handleFileSelection(file) {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

        if (!allowedTypes.includes(file.type)) {
            showError('Please select a PDF, DOCX, or TXT file.');
            return;
        }

        if (file.size > 16 * 1024 * 1024) {
            showError('File size must be less than 16MB.');
            return;
        }

        selectedFile = file;
        if (fileName) fileName.textContent = file.name;
        if (filePreview) filePreview.style.display = 'block';
        updateButtonState();
    }

    // Auto-resize textarea
    if (userInput) {
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = userInput.scrollHeight + 'px';
            updateButtonState();
        });

        // Handle Enter key
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if ((userInput.value.trim() || selectedFile) && clarifyButton && !clarifyButton.disabled) {
                    clarifyButton.click();
                }
            }
        });
    }

    function updateButtonState() {
        if (!clarifyButton) return;
        
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) return;
        
        const tabName = activeTab.dataset.tab;
        const hasContent = (tabName === 'text' && userInput && userInput.value.trim()) || 
                          (tabName === 'file' && selectedFile);

        clarifyButton.disabled = !hasContent;
        const buttonText = clarifyButton.querySelector('.button-text');
        if (buttonText) {
            buttonText.textContent = hasContent ? 'Analyze Content' : 'Select content first';
        }
    }

    if (clarifyButton) {
        clarifyButton.addEventListener('click', async () => {
            const activeTab = document.querySelector('.tab-button.active');
            if (!activeTab) return;
            
            const tabName = activeTab.dataset.tab;

            if (tabName === 'text' && (!userInput || !userInput.value.trim())) {
                showError('Please enter some text or URL first!');
                return;
            }

            if (tabName === 'file' && !selectedFile) {
                showError('Please select a file first!');
                return;
            }

            // Show loading state
            showLoading();
            clarifyButton.disabled = true;
            if (followupSection) followupSection.style.display = 'none';
            if (followupResponse) followupResponse.style.display = 'none';

            try {
                let response;

                if (tabName === 'file') {
                    // Handle file upload
                    const formData = new FormData();
                    formData.append('file', selectedFile);

                    response = await fetch('/clarify', {
                        method: 'POST',
                        body: formData,
                    });
                } else {
                    // Handle text/URL input
                    response = await fetch('/clarify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: userInput.value.trim() }),
                    });
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.error) {
                    showError(`Error: ${data.error}`);
                    return;
                }

                // Store original text and analysis for follow-ups
                originalText = data.original_text || (userInput ? userInput.value.trim() : '');
                previousAnalysis = data.ai_response;

                // Parse AI response
                let aiData;
                try {
                    aiData = JSON.parse(data.ai_response);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    showError('The AI response was not in the expected format. Please try again.');
                    return;
                }

                if (!aiData || typeof aiData !== 'object') {
                    showError('Invalid response format received from AI.');
                    return;
                }

                // Show results and follow-up options
                showResults(aiData);
                if (followupSection) followupSection.style.display = 'block';

            } catch (error) {
                console.error('Error:', error);
                showError('Sorry, something went wrong. Please check your connection and try again.');
            } finally {
                clarifyButton.disabled = false;
                updateButtonState();
            }
        });
    }

    // Follow-up functionality
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('followup-btn')) {
            const question = e.target.dataset.question;
            await handleFollowup(question);
        }
    });

    async function handleFollowup(question) {
        if (!followupContent || !followupResponse) return;
        
        followupContent.innerHTML = '<div class="loading">Processing follow-up...</div>';
        followupResponse.style.display = 'block';

        try {
            const response = await fetch('/followup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_text: originalText,
                    previous_analysis: previousAnalysis,
                    question: question
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                followupContent.innerHTML = `<div class="error">Error: ${data.error}</div>`;
                return;
            }

            let followupData;
            try {
                followupData = JSON.parse(data.ai_response);
            } catch (parseError) {
                followupContent.innerHTML = '<div class="error">Failed to parse follow-up response.</div>';
                return;
            }

            followupContent.innerHTML = `<p>${escapeHtml(followupData.response || 'No response available')}</p>`;

        } catch (error) {
            console.error('Follow-up Error:', error);
            followupContent.innerHTML = '<div class="error">Follow-up request failed. Please try again.</div>';
        }
    }

    function showLoading() {
        if (!outputSection || !resultsDiv) return;
        
        outputSection.style.display = 'block';
        resultsDiv.innerHTML = '<div class="loading">Analyzing your content...</div>';
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showError(message) {
        if (!outputSection || !resultsDiv) return;
        
        outputSection.style.display = 'block';
        resultsDiv.innerHTML = `<div class="error">${message}</div>`;
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showResults(aiData) {
        if (!resultsDiv || !outputSection) return;
        
        const summary = aiData.summary || 'No summary available';
        const actionItems = Array.isArray(aiData.action_items) ? aiData.action_items : [];
        const deadlines = Array.isArray(aiData.deadlines) ? aiData.deadlines : [];

        let htmlOutput = `
            <h3>Summary</h3>
            <p>${escapeHtml(summary)}</p>
        `;

        if (actionItems.length > 0) {
            htmlOutput += `
                <h3>Action Items</h3>
                <ul>
                    ${actionItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
            `;
        } else {
            htmlOutput += `
                <h3>Action Items</h3>
                <p style="color: var(--subtle-text-color); font-style: italic;">No action items identified</p>
            `;
        }

        if (deadlines.length > 0) {
            htmlOutput += `
                <h3>Deadlines</h3>
                <ul>
                    ${deadlines.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
            `;
        } else {
            htmlOutput += `
                <h3>Deadlines</h3>
                <p style="color: var(--subtle-text-color); font-style: italic;">No deadlines identified</p>
            `;
        }

        resultsDiv.innerHTML = htmlOutput;
        resultsDiv.style.display = 'block';
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize button state
    updateButtonState();
});
