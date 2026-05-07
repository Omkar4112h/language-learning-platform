import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def ask_gpt(user_message: str):

    prompt = f"""
You are an AI-powered language learning assistant.

User: {user_message}
"""

    payload = {
        "model": "mistral",
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)

        data = response.json()

        return data["response"]

    except Exception as e:
        return f"Error: {str(e)}"