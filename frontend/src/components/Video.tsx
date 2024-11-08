//Realtime speech to text based on the audio

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3000"

export default function Video() {
    const socketRef = useRef<Socket | null>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const localAudioRef = useRef<HTMLAudioElement | null>(null)
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const [socketId, setSocketId] = useState("");

    useEffect(() => {
        // setup websocket connection 
        socketRef.current = io(URL);
        socketRef.current.on("connect", () => {
            console.log("Socket Connected: ", socketRef.current?.id )
            if(socketRef.current)
                setSocketId(socketRef.current.id!)
        });
    
        return () => {
            disconect();
        }

    }, []);
    
    const connect = async () => {

        // create RTC peer connection 
        peerConnectionRef.current= new RTCPeerConnection({
            iceServers : [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
        })
        
        // Handle server Answer, Icecandidates and tracks (Server To Local)
        socketRef.current?.on('server-answer', (answer: RTCSessionDescription) => {
            console.log("Got answer from server");
            if(answer)
                peerConnectionRef.current?.setRemoteDescription(answer);
        });

        socketRef.current?.on('server-ice-candidate', (serverIceCandidate: RTCIceCandidate) => {
            console.log("Got Ice candidate from server");
            if(serverIceCandidate)
                peerConnectionRef.current?.addIceCandidate(serverIceCandidate);
        });

        peerConnectionRef.current.addEventListener('track', (event) => {
            console.log("Got track from the server");
            const serverStream: MediaStream = event.streams[0];
            if(remoteAudioRef.current)
                remoteAudioRef.current.srcObject = serverStream

        });

        // get local audio stream and attach it to the HTMLAudioEle and sedd to the server
        // and send ICE candidates to the server and create offer (Local to Server)
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = localStream
        if(localAudioRef.current)
            localAudioRef.current.srcObject = localStream

        localStream.getTracks().forEach((track) => {
            peerConnectionRef.current?.addTrack(track)
        });

        peerConnectionRef.current.addEventListener("icecandidate", (event) => {
            console.log("Got ICE candidates form the server");
            if(event.candidate)
                socketRef.current?.emit("client-ice-candidate", event.candidate)
        });

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current?.emit("client-offer", offer);

    }

    const disconect = async () => {
        if(peerConnectionRef.current){
            peerConnectionRef.current.close()
            peerConnectionRef.current = null;
        }
        socketRef.current?.disconnect();
        if(remoteAudioRef.current)
            remoteAudioRef.current.srcObject = null
        if(localAudioRef.current)
            localAudioRef.current.srcObject = null
        setSocketId("")
    }

    return (
        <>
        <h1> Connected with Socket Id: {socketId} </h1>
        <button onClick={connect}> Connect </button>
        <button onClick={disconect}> Disconnect </button>
        <audio ref={localAudioRef} autoPlay />
        <audio ref={remoteAudioRef} autoPlay />
        </>
    )
}