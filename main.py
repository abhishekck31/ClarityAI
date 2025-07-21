
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
You are ClarityAI, an expert productivity assistant. Analyze the user's text.
Respond with ONLY a valid JSON object with three keys: 'summary', 'action_items', 'deadlines'.
'summary': A single sentence summary.
'action_items': A list of tasks. If none, return an empty list [].
'deadlines': A list of deadlines. If none, return an empty list [].
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
        # We send the AI's clean response back to the website
        return jsonify({"ai_response": response.text})
    except Exception as e:
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=81)
