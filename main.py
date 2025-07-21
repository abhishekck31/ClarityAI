
from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai

app = Flask(__name__)

# This gets your secret key and sets up the AI model
try:
    genai.configure(api_key=os.environ['GEMINI_API_KEY'])
    model = genai.GenerativeModel('gemini-1.5-flash')
except KeyError:
    # This will show an error if the secret key is missing
    print("API Key not found! Please set the GEMINI_API_KEY in Replit Secrets.")
    model = None

# This is our "secret recipe" prompt that we send to the AI
MASTER_PROMPT = """
You are ClarityAI, an expert productivity assistant. Analyze the user's text and respond with ONLY a valid JSON object.

IMPORTANT: Your response must be ONLY valid JSON, no markdown, no explanations, no code blocks.

Format your response exactly like this:
{
  "summary": "A single sentence summary of the text",
  "action_items": ["task 1", "task 2"],
  "deadlines": ["deadline 1", "deadline 2"]
}

If there are no action items or deadlines, use empty arrays [].
"""

@app.route('/')
def index():
  return render_template('index.html')

# This is the new part that handles the button click
@app.route('/clarify', methods=['POST'])
def clarify_text():
    if model is None:
        return jsonify({"error": "API Key is not configured."}), 500

    user_text = request.json['text']

    # We combine our recipe with the user's text
    full_prompt = MASTER_PROMPT + "User Text: " + user_text
    
    try:
        response = model.generate_content(full_prompt)
        
        # Clean the response to extract only JSON
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        # Find the JSON object in the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_text = response_text[start_idx:end_idx+1]
        else:
            json_text = response_text
        
        # We send the AI's clean response back to the website
        return jsonify({"ai_response": json_text.strip()})
    except Exception as e:
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=81)
