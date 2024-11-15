import { useState, useEffect, useRef } from "react"

const URL = 'http://0.0.0.0:80'

export default function PythonWS() {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteStreamRef = useRef(new MediaStream());

    
    const connect = async () => {
        pcRef.current = new RTCPeerConnection({
            iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
        })

        // Add remote stream to video element
        pcRef.current.ontrack =  (event) => {
            console.log("REMOTE STREAM RECEIVED!!!: ", event.track)
            remoteStreamRef.current.addTrack(event.track);
            if(remoteVideoRef.current)
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
        
        // Get local media and attach to peer connection
        await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then((stream) => {
            console.log("Got Local Stream")
            if(localVideoRef.current)
                localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((track) => {
                pcRef.current?.addTrack(track, stream);
            })
        })
        .catch((error) => {
            console.log("Error getting local stream: ", error)
            alert("Error getting local stream: ")
        })

        // Create Offer. Get Ice candidates and send to server
        await pcRef.current.createOffer()
        .then((offer) => {
            console.log("Created Offer: ", offer)
            pcRef.current?.setLocalDescription(offer);
            console.log("Local Description Set")
        })
        .then(() => {
            console.log("Waiting for Ice Gathering to complete")
            return new Promise<void>((resolve, _) => {
                const check = () => {
                    if(pcRef.current?.iceGatheringState === "complete") {
                        // pcRef.current?.removeEventListener("icegatheringstatechange", () => {});
                        console.log("Ice Gathering Complete")
                        resolve();
                    }
                }
                pcRef.current?.addEventListener("icegatheringstatechange", check);
                check();
            });
        })
        .then(() => {
            const offer = pcRef.current?.localDescription;
            console.log("Sending offer to server: ", offer)
            return fetch(`${URL}`, {
                body: JSON.stringify({ 
                    type: offer?.type,
                    sdp: offer?.sdp
                }),
                headers: {
                    "Content-type": "application/json"
                },
                method: "POST"
            });
        })
        .then((response) => {
            return response.json();
        })
        .then((answer) => {
            return pcRef.current?.setRemoteDescription(answer);
        })
        .catch((error) => {
            alert(error)
            console.log("Error", error)
        })

        console.log("Got answer from server: ", pcRef.current?.remoteDescription)
        console.log("Connected to Server")

    }

    const disconnect =  () => {
        if(pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
            console.log("Peer Connection Closed")
        }
        if(localVideoRef.current)
            localVideoRef.current.srcObject = null;
        if(remoteVideoRef.current)
            remoteVideoRef.current.srcObject = null;
        
        window.location.reload();
    };
        

    return (
        <div className="flex flex-col justify-center items-center">
            <h1>Python Websocket</h1>
            <div className="flex flex-row gap-4">
                <button onClick={connect}> Connect </button>
                <button onClick={disconnect}> Disconnect </button>
            </div>
            <h1> Local Video </h1>
            {/* <video ref={localVideoRef} autoPlay playsInline/> */}
            <h1> Remote Video </h1>
            <video ref={remoteVideoRef} autoPlay playsInline/>
        </div>
    )
}