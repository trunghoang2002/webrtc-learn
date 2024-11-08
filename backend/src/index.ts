import  express  from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
const { RTCPeerConnection, RTCSessionDescription } = require('@roamhq/wrtc')

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

const users: any = {}

io.on("connection", (socket: Socket) => {
  console.log("Connected Socket: ", socket.id);

  const peerConnection: RTCPeerConnection= new RTCPeerConnection({
    iceServers: [{ urls : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] } ]
  });

  users[socket.id] = { peerConnection };

   // getting server Ice candidates
   peerConnection.addEventListener("icecandidate", (event) => {
    if(event.candidate) {
      //emit candidates to the user
      socket.emit("server-ice-candidate", event.candidate)
    }
  });


  //Handle incomming client ice candidates
  socket.on("client-ice-candidate", async (candidate: RTCIceCandidate) => {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.log("Error Receiving ICE candidates")
    }
  });

  //handle SDP offer comming from the client
  socket.on("client-offer", async (offer: RTCSessionDescription) => {
    await peerConnection.setRemoteDescription(offer);

    //creating answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("server-answer", answer);
  });

  // handling track received from the client 
  peerConnection.addEventListener("track", (event) => {
    console.log("Received audio track from user");

    const sender = peerConnection.addTrack(event.track);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconect socket: ", socket.id, reason );
    if(peerConnection)  {
      peerConnection.close()
      console.log("Closed Peer connection")
    }
  });
  
});

httpServer.listen(3000);