import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCConfiguration,RTCIceCandidate, MediaStreamTrack
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# create FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

class VideoTransformTrack(MediaStreamTrack):
    """
    A video stream track that transforms frames from an another track.
    """

    kind = "video"

    def __init__(self, track):
        super().__init__()  # don't forget this!
        self.track = track

    async def recv(self):
        frame = await self.track.recv()

        return frame

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

        @pc.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            print("ICE connection state is: ", pc.iceConnectionState)
            if pc.iceConnectionState == "failed":
                await pc.close()
                logger.info("PeerConnection closed")
        
        @pc.on("track")
        async def on_track(track):
            print(f"Track received: {track} of kind {track.kind}" )
            local_video = VideoTransformTrack(
                track
            )
            pc.addTrack(local_video)
        
        await pc.setRemoteDescription(offer)
        print("Remote Description Set \n",)

        answer = await pc.createAnswer()
        print("Answer Created: \n" , )
        
        await pc.setLocalDescription(answer)
        print("Local Description Set: \n", pc.localDescription)
        
    except Exception as e:
        print("Exception: \n", e)
        # print("Exception: ", e)

    return {"type": pc.localDescription.type, "sdp": pc.localDescription.sdp}




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)