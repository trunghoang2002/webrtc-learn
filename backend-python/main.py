import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from tracks import AudioTransformTrack, VideoTransformTrack
import uvicorn
import logging
import datetime
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# create whisper model 
MODEL_TYPE, RUN_TYPE, COMPUTE_TYPE, NUM_WORKERS, CPU_THREADS, WHISPER_LANG = "tiny.en", "cpu", "int8", 10, 4, "en"
whisper_model = WhisperModel(
    model_size_or_path=MODEL_TYPE,
    device=RUN_TYPE,
    compute_type=COMPUTE_TYPE,
    num_workers=NUM_WORKERS,
    cpu_threads=CPU_THREADS,
    download_root="./models"
)

# create FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def read_root():
    return {"message": "Professional Moterboater"}

@app.post("/")
async def offer(request: Request):
    try:
        params = await request.json()
        print(f"Params: \n", params); print("Type of Param: \n", type(params))
        offer = RTCSessionDescription(type=params["type"], sdp=params["sdp"])

        pc = RTCPeerConnection()
        print("Created PeerConnection Object")
        
        @pc.on("track")
        def on_track(track):
            print(f"Track received: {track} of kind {track.kind}")
            if(track.kind == "audio"):
                pc.addTrack(AudioTransformTrack(track))
            if(track.kind == "video"):
                pc.addTrack(VideoTransformTrack(track))
       
        # handle offer
        await pc.setRemoteDescription(offer)

        # send answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        
    except Exception as e:
        print("Exception: \n", e)
        # print("Exception: ", e)

    return {"type": pc.localDescription.type, "sdp": pc.localDescription.sdp}




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)