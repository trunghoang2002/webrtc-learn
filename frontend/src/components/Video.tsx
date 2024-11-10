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

    // const connect = async () => {
    //     const localStream = await navigator.mediaDevices.getUserMedia({audio: true});
    //     if(remoteAudioRef.current)
    //         remoteAudioRef.current.srcObject = localStream
    // };

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
            console.log("Received track from server:", event.track);
            console.log("Track ID:", event.track.id);
            console.log("Track kind:", event.track.kind);  // Should be 'audio'
            console.log("Track label:", event.track.label);
            
            const audioContext = new AudioContext();
            const serverStream = new MediaStream();
            serverStream.addTrack(event.track)
            console.log("Server Stream: ", serverStream);
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
            console.log("Got ICE candidates form the stun sending it to server");
            if(event.candidate)
                socketRef.current?.emit("client-ice-candidate", event.candidate)
        });

        peerConnectionRef.current.addEventListener("connectionstatechange", (_) => { 
            if(peerConnectionRef.current?.connectionState === "connected"){
                console.log("Connected with the server")
                socketRef.current?.emit("client-connected", { socketId: socketRef.current?.id })
            }
        });

        socketRef.current?.on("disconnect", () => {
            console.log("Socket Disconnected")
            setSocketId(socketRef.current?.id!);
        })

        const offer = await peerConnectionRef.current.createOffer(); console.log("Offer Created")
        await peerConnectionRef.current.setLocalDescription(offer);console.log("Local Descriptionset")
        socketRef.current?.emit("client-offer", offer);

    }

    const disconect = async () => {
        if(peerConnectionRef.current){
            peerConnectionRef.current.close()
            peerConnectionRef.current = null;
        }
        socketRef.current?.disconnect();
        if(localStreamRef.current){
            localStreamRef.current.getTracks().forEach( track=> track.stop())
        }
        if(localAudioRef.current)
            localAudioRef.current.srcObject = null

        if(remoteAudioRef.current)
            remoteAudioRef.current.srcObject = null

        setSocketId("")

        console.log("Disconnected")
    }

    return (
        <>
        <h1> Connected with Socket Id: {socketId} </h1>
        <button onClick={connect}> Connect </button>
        <button onClick={disconect}> Disconnect </button>
        {/* <audio ref={localAudioRef} autoPlay playsInline /> */}
        <h2> Remote Video </h2>
        {/* <div className="flex flex-col justify-center items-center"> */}
            <audio ref={remoteAudioRef} autoPlay playsInline />
        {/* </div> */}
        </>
    )
}