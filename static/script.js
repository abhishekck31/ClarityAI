document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const promptInput = document.getElementById('promptInput');
    const runButton = document.getElementById('runButton');
    const addFileBtn = document.getElementById('addFileBtn');
    const fileInput = document.getElementById('fileInput');
    const welcomeSection = document.getElementById('welcomeSection');
    const analysisSection = document.getElementById('analysisSection');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const resultsContainer = document.getElementById('resultsContainer');
    const backButton = document.getElementById('backButton');
    

    // Store current analysis data
    let currentAnalysis = null;

    // Handle file upload button
    if (addFileBtn && fileInput) {
        addFileBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
    }

    // Handle run button
    if (runButton && promptInput) {
        runButton.addEventListener('click', () => {
            const text = promptInput.value.trim();
            if (text) {
                analyzeText(text);
            }
        });

        // Handle Enter key
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const text = promptInput.value.trim();
                if (text) {
                    analyzeText(text);
                }
            }
        });
    }

    // Handle back button
    if (backButton) {
        backButton.addEventListener('click', () => {
            showWelcomeSection();
        });
    }

    

    function showWelcomeSection() {
        if (welcomeSection) welcomeSection.style.display = 'block';
        if (analysisSection) analysisSection.style.display = 'none';
    }

    function showAnalysisSection() {
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'block';
    }

    function showLoading() {
        if (loadingState) loadingState.style.display = 'flex';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
    }

    function showError(message) {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            errorState.textContent = message;
        }
        if (resultsContainer) resultsContainer.style.display = 'none';
    }

    function showResults(data) {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';

        // Parse AI response
        try {
            const analysis = JSON.parse(data.ai_response);
            currentAnalysis = {
                ...analysis,
                original_text: data.original_text
            };

            // Update summary
            const summaryResult = document.getElementById('summaryResult');
            if (summaryResult) {
                summaryResult.textContent = analysis.summary || 'No summary available';
            }

            // Update action items
            const actionItemsList = document.getElementById('actionItemsList');
            if (actionItemsList) {
                actionItemsList.innerHTML = '';
                if (analysis.action_items && analysis.action_items.length > 0) {
                    analysis.action_items.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        actionItemsList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'No action items found';
                    li.style.fontStyle = 'italic';
                    actionItemsList.appendChild(li);
                }
            }

            // Update deadlines
            const deadlinesList = document.getElementById('deadlinesList');
            if (deadlinesList) {
                deadlinesList.innerHTML = '';
                if (analysis.deadlines && analysis.deadlines.length > 0) {
                    analysis.deadlines.forEach(deadline => {
                        const li = document.createElement('li');
                        li.textContent = deadline;
                        deadlinesList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'No deadlines found';
                    li.style.fontStyle = 'italic';
                    deadlinesList.appendChild(li);
                }
            }
        } catch (error) {
            console.error('Error parsing analysis:', error);
            showError('Failed to parse analysis results');
        }
    }

    async function analyzeText(text) {
        showAnalysisSection();
        showLoading();

        try {
            const response = await fetch('/clarify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
            } else {
                showResults(data);
            }
        } catch (error) {
            console.error('Network Error:', error);
            showError('Network error. Please check your connection and try again.');
        }
    }

    async function handleFileUpload(file) {
        showAnalysisSection();
        showLoading();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/clarify', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
            } else {
                showResults(data);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to process file. Please try again.');
        }
    }

    function shareResults() {
        if (!currentAnalysis) return;

        const shareText = `ClarityAI Analysis Results:

Summary: ${currentAnalysis.summary}

Action Items:
${currentAnalysis.action_items && currentAnalysis.action_items.length > 0 ? 
    currentAnalysis.action_items.map(item => `• ${item}`).join('\n') : 
    '• No action items found'}

Deadlines:
${currentAnalysis.deadlines && currentAnalysis.deadlines.length > 0 ? 
    currentAnalysis.deadlines.map(deadline => `• ${deadline}`).join('\n') : 
    '• No deadlines found'}`;

        if (navigator.share) {
            navigator.share({
                title: 'ClarityAI Analysis Results',
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard!');
            }).catch(() => {
                alert('Unable to copy to clipboard. Please select and copy manually.');
            });
        }
    }
});
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
    // Elements
    const promptInput = document.getElementById('promptInput');
    const runButton = document.getElementById('runButton');
    const backButton = document.getElementById('backButton');
    const welcomeSection = document.getElementById('welcomeSection');
    const analysisSection = document.getElementById('analysisSection');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const resultsContainer = document.getElementById('resultsContainer');
    const summaryResult = document.getElementById('summaryResult');
    const actionItemsList = document.getElementById('actionItemsList');
    const deadlinesList = document.getElementById('deadlinesList');
    
    // Header controls
    const addFileBtn = document.getElementById('addFileBtn');
    const fileInput = document.getElementById('fileInput');

    // State
    let isAnalyzing = false;
    let currentResults = null;

    // Auto-resize textarea
    if (promptInput) {
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
        });

        // Handle Enter key (Ctrl+Enter to run)
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleAnalyze();
            }
        });
    }

    // Run button click
    if (runButton) {
        runButton.addEventListener('click', handleAnalyze);
    }

    // Back button click
    if (backButton) {
        backButton.addEventListener('click', () => {
            showWelcomeSection();
        });
    }

    // File upload functionality
    if (addFileBtn && fileInput) {
        addFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await handleFileUpload(file);
            }
        });
    }

    

    // Feature card clicks
    document.addEventListener('click', (e) => {
        const featureCard = e.target.closest('.feature-card');
        if (featureCard) {
            const title = featureCard.querySelector('.feature-title').textContent;

            // Set example prompts based on feature
            let examplePrompt = '';
            switch (title) {
                case 'Smart Summarization':
                    examplePrompt = 'Meeting notes from today\'s project discussion: We reviewed the Q3 roadmap, discussed budget constraints, and assigned action items for next week.';
                    break;
                case 'Action Item Extraction':
                    examplePrompt = 'Project update: Need to finalize the proposal by Friday, schedule client meeting for next week, and review the budget with finance team.';
                    break;
                case 'Deadline Detection':
                    examplePrompt = 'Important dates: Submit report by March 15th, team meeting on Monday at 2 PM, project deadline is end of month.';
                    break;
                case 'URL Analysis':
                    examplePrompt = 'https://example.com/article';
                    break;
                default:
                    examplePrompt = 'Analyze this text and extract key insights';
            }

            if (promptInput) {
                promptInput.value = examplePrompt;
                promptInput.focus();
            }
        }
    });

    function showWelcomeSection() {
        if (welcomeSection) welcomeSection.style.display = 'block';
        if (analysisSection) analysisSection.style.display = 'none';
        if (promptInput) promptInput.focus();
    }

    function showAnalysisSection() {
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (analysisSection) analysisSection.style.display = 'block';
    }

    function showLoading() {
        if (loadingState) loadingState.style.display = 'flex';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
    }

    function showError(message) {
        if (errorState) {
            errorState.textContent = message;
            errorState.style.display = 'block';
        }
        if (loadingState) loadingState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
    }

    function showResults(data) {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';

        // Store results for sharing
        currentResults = data;

        // Populate summary
        if (summaryResult && data.summary) {
            summaryResult.textContent = data.summary;
        }

        // Populate action items
        if (actionItemsList && data.action_items) {
            actionItemsList.innerHTML = '';
            if (data.action_items.length > 0) {
                data.action_items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    actionItemsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No action items identified';
                li.style.color = 'var(--text-muted)';
                li.style.fontStyle = 'italic';
                actionItemsList.appendChild(li);
            }
        }

        // Populate deadlines
        if (deadlinesList && data.deadlines) {
            deadlinesList.innerHTML = '';
            if (data.deadlines.length > 0) {
                data.deadlines.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    deadlinesList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No deadlines identified';
                li.style.color = 'var(--text-muted)';
                li.style.fontStyle = 'italic';
                deadlinesList.appendChild(li);
            }
        }
    }

    async function handleFileUpload(file) {
        if (isAnalyzing) return;

        isAnalyzing = true;
        showAnalysisSection();
        showLoading();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/clarify', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                showError(`Error: ${data.error}`);
                return;
            }

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

            showResults(aiData);

        } catch (error) {
            console.error('Error:', error);
            showError('Sorry, something went wrong. Please check your connection and try again.');
        } finally {
            isAnalyzing = false;
        }
    }

    function shareResults(data) {
        const shareText = `ClarityAI Analysis Results:\n\nSUMMARY:\n${data.summary}\n\nACTION ITEMS:\n${data.action_items.length > 0 ? data.action_items.map(item => `• ${item}`).join('\n') : '• No action items identified'}\n\nDEADLINES:\n${data.deadlines.length > 0 ? data.deadlines.map(item => `• ${item}`).join('\n') : '• No deadlines identified'}`;

        if (navigator.share) {
            navigator.share({
                title: 'ClarityAI Analysis Results',
                text: shareText,
            }).catch(err => console.log('Error sharing:', err));
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                // Show temporary success message
                const originalText = shareBtn.innerHTML;
                shareBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';
                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
                showError('Could not copy results to clipboard.');
            });
        }
    }

    async function handleAnalyze() {
        if (!promptInput || isAnalyzing) return;

        const text = promptInput.value.trim();
        if (!text) {
            showError('Please enter some text to analyze');
            return;
        }

        isAnalyzing = true;
        showAnalysisSection();
        showLoading();

        try {
            const response = await fetch('/clarify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                showError(`Error: ${data.error}`);
                return;
            }

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

            showResults(aiData);

        } catch (error) {
            console.error('Error:', error);
            showError('Sorry, something went wrong. Please check your connection and try again.');
        } finally {
            isAnalyzing = false;
        }
    }

    // Initialize
    showWelcomeSection();
});