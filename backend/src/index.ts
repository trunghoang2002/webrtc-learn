import  express  from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { RTCPeerConnection, RTCSessionDescription } from '@roamhq/wrtc'
const { createClient } = require('@deepgram/sdk');
import textToSpeech from '@google-cloud/text-to-speech';
const VAD = require('node-vad');
import { Readable } from 'stream';
const { AudioContext } = require('web-audio-api');
import { config } from "dotenv";
config();


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"]
  }
});

const users: any = {}

//Initialize Deepgram gogle speech to text vad
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const ttsClient = new textToSpeech.TextToSpeechClient();
const vad = new VAD(VAD.Mode.NORMAL);


io.on("connection", (socket: Socket) => {
  console.log("Connected Socket: ", socket.id);

  const peerConnection: RTCPeerConnection= new RTCPeerConnection({
    iceServers: [{ urls : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] } ]
  });

  // users[socket.id] = { peerConnection };

  // getting server Ice candidates
  peerConnection.addEventListener("icecandidate", (event) => {
    console.log("Got Ice candidates form stun sending to client")
    if(event.candidate) {
      //emit candidates to the user
      socket.emit("server-ice-candidate", event.candidate)
    }
  });


  //Handle incomming client ice candidates
  socket.on("client-ice-candidate", async (candidate: RTCIceCandidate) => {
    console.log("Got Ice candidated from client");
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.log("Error Receiving ICE candidates")
    }
  });

  //handle SDP offer comming from the client
  socket.on("client-offer", async (offer: RTCSessionDescription) => {
    console.log("Received offer from client")
    await peerConnection.setRemoteDescription(offer);

    //creating answer
    const answer = await peerConnection.createAnswer();
    console.log("Created answer: ", answer);
    await peerConnection.setLocalDescription(answer);

    socket.emit("server-answer", answer);
  });

  // handling track received from the client 
  peerConnection.addEventListener("track", async (event) => {
    console.log("Received audio track from user", event.track);
    console.log("Track type:", event.track.kind); // 'audio' or 'video'
    console.log("Track Id:", event.track.id); 
    const sender = peerConnection.addTrack(event.track);
  });

  socket.on("client-connected", () => {  
    console.log("Client connected");
    socket.disconnect()
  });

  
  socket.on("disconnect", (reason) => {
    console.log("Disconect socket: ", socket.id, reason );
    // if(peerConnection)  {
    //   peerConnection.close()
    //   console.log("Closed Peer connection")
    // }
  });
  
});

httpServer.listen(3000);