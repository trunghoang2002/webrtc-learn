import os
from openai import OpenAI
from dotenv import load_dotenv
# from pydub import AudioSegment
import io
load_dotenv()

# OPENAI TTS
client = OpenAI()
# response = client.audio.speech.create(
#     model="tts-1",
#     voice="alloy",
#     input="Hey there sexy seeing you after a long time, come suck my dick.",
#     response_format="mp3"
# )


# data = response.read()
# print(f"Response type: {type(data)}, Data: {data[:10]}")

# # mp3_file = io.BytesIO(data)
# # audio_segment = 

# filename = "output.mp3"
# with open(filename, "wb") as f:
#     for data in response.iter_bytes():
#         print(f"Response type: {type(data)}, Data: {data[:10]}")
#         f.write(data)





