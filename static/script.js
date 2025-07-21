document.addEventListener('DOMContentLoaded', () => {
  const clarifyButton = document.getElementById('clarifyButton');
  const userInput = document.getElementById('userInput');
  const resultsDiv = document.getElementById('results');

  clarifyButton.addEventListener('click', async () => {
    const text = userInput.value;
    if (text.trim() === '') {
      alert('Please enter some text!');
      return;
    }

    // Show a 'loading' message
    resultsDiv.innerHTML = '<div class="loading">Clarifying your text...</div>';

    try {
      // Send the text to the backend "kitchen"
      const response = await fetch('/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
      });

      const data = await response.json();

      if (data.error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${data.error}</div>`;
        return;
      }

      // The AI's response is text that looks like JSON, so we parse it
      let aiData;
      try {
        aiData = JSON.parse(data.ai_response);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        resultsDiv.innerHTML = '<div class="error">The AI response was not in the expected format. Please try again.</div>';
        return;
      }

      // Format and display the results nicely
      let htmlOutput = `
        <h3>Summary</h3>
        <p>${aiData.summary}</p>
        <h3>Action Items</h3>
        <ul>
          ${aiData.action_items.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <h3>Deadlines</h3>
        <ul>
          ${aiData.deadlines.map(item => `<li>${item}</li>`).join('')}
        </ul>
      `;
      resultsDiv.innerHTML = htmlOutput;

    } catch (error) {
      console.error('Error:', error);
      resultsDiv.innerHTML = '<div class="error">Sorry, something went wrong. Please check the console.</div>';
    }
  });
});