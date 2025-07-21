
from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
import PyPDF2
from docx import Document
import io
import re
from urllib.parse import urlparse

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

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

FOLLOWUP_PROMPT = """
You are ClarityAI, an expert productivity assistant. Based on the original text and previous analysis, answer the follow-up question.

IMPORTANT: Your response must be ONLY valid JSON, no markdown, no explanations, no code blocks.

Format your response exactly like this:
{
  "response": "Your detailed response to the follow-up question"
}
"""

def scrape_url(url):
    """Extract text content from a URL"""
    try:
        # Add basic headers to avoid blocking
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Extract text from common content areas
        content_selectors = [
            'article', 'main', '.content', '.post', '.entry',
            '.article-body', '.story-body', '.post-content'
        ]
        
        text = ""
        for selector in content_selectors:
            content = soup.select(selector)
            if content:
                text = content[0].get_text()
                break
        
        # Fallback to body if no specific content found
        if not text:
            text = soup.get_text()
        
        # Clean up the text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Limit text length to avoid token limits
        return text[:8000]
        
    except Exception as e:
        raise Exception(f"Failed to scrape URL: {str(e)}")

def extract_text_from_pdf(file_stream):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text[:8000]  # Limit text length
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_stream):
    """Extract text from DOCX file"""
    try:
        doc = Document(file_stream)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text[:8000]  # Limit text length
    except Exception as e:
        raise Exception(f"Failed to extract text from DOCX: {str(e)}")

def extract_text_from_txt(file_stream):
    """Extract text from TXT file"""
    try:
        content = file_stream.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        return content[:8000]  # Limit text length
    except Exception as e:
        raise Exception(f"Failed to extract text from TXT: {str(e)}")

def is_valid_url(url):
    """Check if the provided string is a valid URL"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

@app.route('/')
def index():
  return render_template('index.html')

# This is the new part that handles the button click
@app.route('/clarify', methods=['POST'])
def clarify_text():
    if model is None:
        return jsonify({"error": "API Key is not configured."}), 500

    try:
        # Check if it's a file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            # Extract text based on file type
            filename = file.filename.lower()
            file_stream = io.BytesIO(file.read())
            
            if filename.endswith('.pdf'):
                user_text = extract_text_from_pdf(file_stream)
            elif filename.endswith('.docx'):
                user_text = extract_text_from_docx(file_stream)
            elif filename.endswith('.txt'):
                file_stream.seek(0)
                user_text = extract_text_from_txt(file_stream)
            else:
                return jsonify({"error": "Unsupported file type. Please use PDF, DOCX, or TXT files."}), 400
                
        else:
            # Handle regular text or URL input
            data = request.get_json()
            if not data or 'text' not in data:
                return jsonify({"error": "No text provided"}), 400
                
            user_input = data['text'].strip()
            
            # Check if it's a URL
            if is_valid_url(user_input):
                user_text = scrape_url(user_input)
            else:
                user_text = user_input

        if not user_text or len(user_text.strip()) < 10:
            return jsonify({"error": "Not enough content to analyze"}), 400

        # We combine our recipe with the user's text
        full_prompt = MASTER_PROMPT + "User Text: " + user_text
        
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
        return jsonify({
            "ai_response": json_text.strip(),
            "original_text": user_text[:500] + "..." if len(user_text) > 500 else user_text
        })
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@app.route('/followup', methods=['POST'])
def handle_followup():
    if model is None:
        return jsonify({"error": "API Key is not configured."}), 500

    try:
        data = request.get_json()
        original_text = data.get('original_text', '')
        previous_analysis = data.get('previous_analysis', '')
        followup_question = data.get('question', '')
        
        if not all([original_text, previous_analysis, followup_question]):
            return jsonify({"error": "Missing required data for follow-up"}), 400
        
        # Create follow-up prompt with context
        full_prompt = f"{FOLLOWUP_PROMPT}\n\nOriginal Text: {original_text}\n\nPrevious Analysis: {previous_analysis}\n\nFollow-up Question: {followup_question}"
        
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
        
        return jsonify({"ai_response": json_text.strip()})
        
    except Exception as e:
        return jsonify({"error": f"Follow-up failed: {str(e)}"}), 500

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=81)
