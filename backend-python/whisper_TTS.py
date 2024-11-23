import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

client = OpenAI()
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="Hey there sexy seeing you after a long time, come suck my pussy."
)

filename = "output.wav"
with open(filename, "wb") as f:
    for data in response.iter_bytes():
        print(f"Response type: {type(data)}, Data: {data[:10]}")
        f.write(data)




