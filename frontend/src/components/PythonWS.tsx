import { useState, useEffect, useRef } from "react"

export default function PythonWS() {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    // const [message, setMessage] = useState<string>("");
    // const [input, setInput] = useState<string>("");

    
    const connect = async () => {

        wsRef.current = new WebSocket("ws://localhost:80/wsRTC");

        wsRef.current.onopen = async () => {
            console.log("Connected to server");

            pcRef.current = new RTCPeerConnection({
                iceServers:[ { urls:[ "stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302" ] } ]
            });

            pcRef.current.onicecandidate = (event) => {
                if(event.candidate) {
                    console.log("Sending Ice candidate to server: ", event.candidate, JSON.stringify(event.candidate));
                    wsRef.current?.send(JSON.stringify({ type: "candidate", candidate: event.candidate}));
                }
            }
            
            pcRef.current.ontrack = (event) => {
                const vidStream = new MediaStream();
                vidStream.addTrack(event.track);
                if(remoteVideoRef.current) {
                    console.log("Received track: ", event.track);
                    // console.log("Created Stream: ", vidStream.getTracks());
                    remoteVideoRef.current.srcObject = vidStream;
                }
            }

            await navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    console.log("Adding local stream to peer connection");
                    if(localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                    stream.getTracks().forEach((track) => {
                        pcRef.current?.addTrack(track);
                    });
                });

            const offer = await pcRef.current.createOffer().then((offer) => {
                                    console.log("Created offer: ", offer);
                                    return offer;
                                });
            await pcRef.current.setLocalDescription(offer)
            .then(() => {
                console.log("local description set");
            });
            
            wsRef.current?.send(JSON.stringify({
                type: offer.type,
                sdp: offer.sdp
            }));
        }

        wsRef.current.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "answer") {
                console.log("Received SDP answer from server: ", message);
                const remoteDesc = new RTCSessionDescription({
                    type: message.type,
                    sdp: message.sdp
                });
                await pcRef.current?.setRemoteDescription(remoteDesc);
            } 
            else if (message.type === "candidate") {
                console.log("Received ICE candidate from server: ", message);
                const candidate = new RTCIceCandidate(message.candidate);
                await pcRef.current?.addIceCandidate(candidate);
            }

        }

        wsRef.current.onerror = (error) => {
            console.log("Error in web socket: ", error);
        }

        wsRef.current.onclose = () => {
            console.log("Websocket closed");
        }

    }

    const disconnect =  () => {
        pcRef.current?.close();
        pcRef.current = null;
        
        wsRef.current?.close();
        wsRef.current = null;
    };
        
  

    return (
        <div className="flex flex-col justify-center items-center">
            <h1>Python Websocket</h1>
            <div className="flex flex-row gap-4">
                <button onClick={connect}> Connect </button>
                <button onClick={disconnect}> Disconnect </button>
            </div>
            <h1> Local Video </h1>
            <video ref={localVideoRef} autoPlay playsInline/>
            <h1> Remote Video </h1>
            <video ref={remoteVideoRef} autoPlay playsInline/>
        </div>
    )
}