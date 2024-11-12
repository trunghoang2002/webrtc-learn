import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription
import socketio
from fastapi import FastAPI
import uvicorn

# create FastAPI app
app = FastAPI()

#create socketio server
sio =socketio.AsyncServer(async_mode='asgi')

#Attach the socketio server to the FastAPI app
sio.attach(app)

@app.get("/motor")
async def read_root():
    return {"message": "Professional Moterboater"}

# @sio.event
# async def connect(sid, environ):
#     print("connection established: ", sid)
#     await sio.emit('response', {'message': 'Hello from Server!'})

# @sio.event
# async def message(sid, data):
#     print("message ", data)
#     await sio.emit('response', {'message': f'received message: {data}'})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)