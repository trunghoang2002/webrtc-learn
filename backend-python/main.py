import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCConfiguration,RTCIceCandidate
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("my_logger")

# create FastAPI app
app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Professional Moterboater"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected")
    print("Client connected")
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

@app.websocket("/wsRTC")
async def websocket_rtc(websocket: WebSocket):
    await websocket.accept()
    print("WS Client connected")
    
    config = RTCConfiguration(iceServers=[
        RTCIceServer(urls="stun:stun.l.google.com:19302"),
        RTCIceServer(urls="stun:stun1.l.google.com:19302"),
    ])
    pc = RTCPeerConnection(configuration=config)

    async def on_icecandidate(candidate):
        print("Got server ice candidate: ", candidate)
        await websocket.send_json({"type": "candidate", 
                                   "candidate": candidate})
    pc.onicecandidate = on_icecandidate

    @pc.on("track")
    def on_track(track):
        print("Track received")
        pc.addTrack(track)

    try:
        while True:
            message = await websocket.receive_json()
            if message["type"] == "offer":
                offer = RTCSessionDescription(sdp=message["sdp"], type=message["type"])
                print("Received offer")
                await pc.setRemoteDescription(offer)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                await websocket.send_json({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
            elif message["type"] == "candidate":
                try:
                    candidate = message["candidate"]
                    print("candidate from client: ", candidate)
                    ice_candidate = RTCIceCandidate(
                        component=candidate["candidate"], 
                        sdpMid=candidate["sdpMid"], 
                        sdpMLineIndex=candidate["sdpMLineIndex"],)
                    print("Type of candidate: ", type(candidate))
                    # await pc.addIceCandidate(candidate)
                except Exception as e:
                    print("Exception: ", e)

    except WebSocketDisconnect:
        print("RTC Client disconnected")
        await pc.close()
    except Exception as e:
        print("Custom Exception: ", e)
        await pc.close()

app.websocket("/wsRTC")(websocket_rtc)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)