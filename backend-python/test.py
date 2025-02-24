import requests
import json

messages = []

messages.append({
    "role": "user",
    "content": "Hello"
})

url = 'http://localhost:11434/api/chat'
body = {
    "model": "llama3.2:1b",
    "messages": messages,
    "stream": False
}
x = requests.post(url, json=body)
res_json = json.loads(x.text)

print("Response from Ollama", res_json["message"]["content"])
