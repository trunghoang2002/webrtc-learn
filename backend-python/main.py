import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCConfiguration,RTCIceCandidate, MediaStreamTrack
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# create FastAPI app
app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Professional Moterboater"}

@app.post("/")
async def offer(request: Request):
    params = await request.json()
    offer = RTCSessionDescription(type=params["type"], sdp=params["sdp"])

    pc = RTCPeerConnection()
    logger.info("Created PeerConnection Object for: ", request.client.host)

    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        logger.info("ICE connection state is: ", pc.iceConnectionState)
        if pc.iceConnectionState == "failed":
            await pc.close()
            logger.info("PeerConnection closed")
    
    @pc.on("track")
    async def on_track(track: MediaStreamTrack):
        logger.info(f"Track received: {track} of kind {track.kind}" )
        pc.addTrack(track)
    
    await pc.setRemoteDescription(offer)
    answer = pc.createAnswer()
    await pc.setLocalDescription(answer)

    logger.info("Answer: ", pc.localDescription)

    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)