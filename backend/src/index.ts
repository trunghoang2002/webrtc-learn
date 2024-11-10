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
    await peerConnection.setLocalDescription(answer);

    socket.emit("server-answer", answer);
  });

  // handling track received from the client 
  peerConnection.addEventListener("track", async (event) => {
    console.log("Received audio track from user", event.track);
    console.log("Track type:", event.track.kind); // 'audio' or 'video'
    console.log("Track Id:", event.track.id); 

    if(event.track.kind === "audio") {
      const audioContext = new AudioContext();
      // await audioContext.audioWorklet.addModule('vad-processor.js');
      const source = audioContext.createMediaStreamSource(new MediaStream([event.track]));
      const destination = audioContext.createMediaStreamDestination();
      // const vadNode = new AudioWorkletNode(audioContext, 'vad-processor');

      const processAudio = async (audioBuffer: AudioBuffer) => {
        const inputData = audioBuffer.getChannelData(0);

        // Apply VAD to detect voice activity
        vad.processAudio(inputData, audioContext.sampleRate, async (err: any, speech: any) => {
          if (err) {
            console.error('VAD error:', err);
            return;
          }

          if (speech) {
            console.log('Voice activity detected');

            // Send PCM data to Deepgram for transcription
            const transcription = await deepgram.transcription.preRecorded(
              { buffer: Buffer.from(inputData.buffer), mimetype: 'audio/pcm' },
              { punctuate: true }
            );

            const text = transcription.results.channels[0].alternatives[0].transcript;
            console.log("Transcribed text:", text);

            // Convert text to speech using Google Text-to-Speech
            const [response] = await ttsClient.synthesizeSpeech({
              input: { text },
              voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
              audioConfig: { audioEncoding: 'LINEAR16' },
            });

            // Convert the TTS audio response to a MediaStream
            const ttsAudioBuffer = await audioContext.decodeAudioData(response.audioContent);
            const ttsSource = new AudioBufferSourceNode(audioContext, { buffer: ttsAudioBuffer });
            const ttsDestination = new MediaStreamAudioDestinationNode(audioContext);
            ttsSource.connect(ttsDestination);
            ttsSource.start();

            // Add the processed track to the peer connection
            ttsDestination.stream.getTracks().forEach(track => {
              peerConnection.addTrack(track, ttsDestination.stream);
            });
          } else {
            console.log('No voice activity detected');
          }
        });
      }

      source.connect(destination);

      source.onaudioprocess = (audioProcessingEvent: any) => {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        processAudio(inputBuffer);
      }
    }
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