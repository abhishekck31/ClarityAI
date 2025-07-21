from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")
print("GEMINI_API_KEY:", os.environ.get("GEMINI_API_KEY"))