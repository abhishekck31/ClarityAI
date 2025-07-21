
document.addEventListener('DOMContentLoaded', () => {
    const clarifyButton = document.getElementById('clarifyButton');
    const userInput = document.getElementById('userInput');
    const resultsDiv = document.getElementById('results');
    const outputSection = document.getElementById('outputSection');

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    // Enable/disable button based on input
    userInput.addEventListener('input', () => {
        const hasText = userInput.value.trim().length > 0;
        clarifyButton.disabled = !hasText;
        clarifyButton.querySelector('.button-text').textContent = hasText ? 'Clarify Text' : 'Enter text first';
    });

    // Handle Enter key (Shift+Enter for new line, Enter to submit)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (userInput.value.trim() && !clarifyButton.disabled) {
                clarifyButton.click();
            }
        }
    });

    clarifyButton.addEventListener('click', async () => {
        const text = userInput.value.trim();
        if (!text) {
            showError('Please enter some text first!');
            return;
        }

        // Show loading state
        showLoading();
        clarifyButton.disabled = true;

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
                console.error('Raw AI Response:', data.ai_response);
                showError('The AI response was not in the expected format. Please try again.');
                return;
            }

            // Validate AI response structure
            if (!aiData || typeof aiData !== 'object') {
                showError('Invalid response format received from AI.');
                return;
            }

            // Show results
            showResults(aiData);

        } catch (error) {
            console.error('Network Error:', error);
            showError('Sorry, something went wrong. Please check your connection and try again.');
        } finally {
            clarifyButton.disabled = false;
        }
    });

    function showLoading() {
        outputSection.style.display = 'block';
        resultsDiv.innerHTML = '<div class="loading">Analyzing your text...</div>';
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showError(message) {
        outputSection.style.display = 'block';
        resultsDiv.innerHTML = `<div class="error">${message}</div>`;
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showResults(aiData) {
        // Ensure default values
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
                <p style="color: var(--text-secondary); font-style: italic;">No action items identified</p>
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
                <p style="color: var(--text-secondary); font-style: italic;">No deadlines identified</p>
            `;
        }

        resultsDiv.innerHTML = htmlOutput;
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize button state
    clarifyButton.disabled = true;
    clarifyButton.querySelector('.button-text').textContent = 'Enter text first';
});
