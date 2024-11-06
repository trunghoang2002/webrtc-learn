//changed username to useState so it remains persistent between renders and useRef for didIOffer so that it can update synchronously. 


import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3000"

export default function Video() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [_, setSocketId] = useState<string | null>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const didIOffer = useRef(false);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const [userName] = useState(`Rob-${Math.floor(Math.random() * 100000)}`);

    async function call() {

    }

    async function answerOffer(offer: any[]) {
        
    }

    return (
        <>
            <h1> This is Video Room </h1>
            <h2> User Name: {userName}</h2>
            <div className="flex flex-row justify-between gap-3">
                <video ref={localVideoRef}  autoPlay playsInline muted> </video>
                <video ref={remoteVideoRef} autoPlay playsInline> </video>
            </div>
            <button onClick={call}> Start Call </button>
            <div id="offers">
                <h2> Available Offers </h2>
                {offers.map((offer, index) => (
                    <button 
                        key={index}
                        className="btn btn-success"
                        onClick={() => answerOffer(offer)}
                    >
                        Answer {offer.offererUserName}
                    </button>
                ))}
            </div>
        </>
    )
}