import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3000"

export default function Video() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [message, setMessage] = useState("my msg ");
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socketInstance = io(URL);
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            setSocketId(socketInstance.id ?? null);
        });

        return () => {
            socketInstance.disconnect();
        };

    }, []);

    async function fetchUserMedia() {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            if(localVideoRef.current) 
                localVideoRef.current.srcObject = stream;

            localStreamRef.current = stream
        } catch (err) {
            console.log(`Error Fetching User media: ${err}`);
        }
    }

    async function createPeerConnection(offerObj: any) {

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]
                }
            ]
        });
        peerConnectionRef.current = peerConnection;

        //Initiatize remote stream 
        const remoteStream = new MediaStream();
        if(remoteVideoRef.current) 
            remoteVideoRef.current.srcObject = remoteStream;
        
        // Add local stream to peer connection 
        localStreamRef.current?.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current!)
        })

    }

    return (
        <>
            <h1> This is Video Room </h1>
            <div className="flex flex-row justify-between gap-3">
                <video ref={localVideoRef}  autoPlay playsInline muted> </video>
                <video ref={remoteVideoRef} autoPlay playsInline> </video>
                <h1> This is {message}</h1>
            </div>
        </>
    )
}