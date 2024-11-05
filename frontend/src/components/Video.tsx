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
    // const password = "x";

    useEffect(() => {
        const socketInstance =  io(URL, {
            query: {userName},
        });
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            setSocketId(socketInstance.id ?? null);
        });

        // when client joins for the first time and wants to see all the available offers 
        socketInstance.on("availableOffers", (offers) => {
            console.log(offers);
            setOffers( prevOffers => [...prevOffers, ...offers] ); // concatinate all offers
        });

        // Someone made a new offer
        socketInstance.on("newOfferAwaiting", (offers) => {
            console.log(offers);
            setOffers( prevOffers => [...prevOffers, ...offers] );
        });

        socketInstance.on("answerResponse", (offerObj) => {
            console.log(offerObj);
            //Add answer response to the peer connection remote description
            // addAnswer(offerObj);
            peerConnectionRef.current?.setRemoteDescription(offerObj.answer);
        });

        socketInstance.on("receivedIceCandidateFromServer", (iceCandidate) => {
            console.log(iceCandidate);
            // Add Ice candidates to peer connection as remote
            // addNewIceCandidates(iceCandidate);
            peerConnectionRef.current?.addIceCandidate(iceCandidate);
        });

        return () => {
            socketInstance.disconnect();
        };

    }, []);

    async function fetchUserMedia() {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                // audio: true
            });
            if(localVideoRef.current) 
                localVideoRef.current.srcObject = stream;

            localStreamRef.current = stream
        } catch (err) {
            console.log(`Error Fetching User media: ${err}`);
        }
    }

    async function createPeerConnection(offerObj?: any) {

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
        remoteStreamRef.current = remoteStream;
        
        // Add local stream to peer connection 
        localStreamRef.current?.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current!)
        });

        //EventListners 
        peerConnection.addEventListener("icecandidate", (event: RTCPeerConnectionIceEvent)=> {
            if(event.candidate && socket) {
                console.log("checking did i off er in iceCandidate event ", didIOffer);
                console.log("ICE candidates ", event.candidate)
                socket.emit("sendIceCandidatesToSignallingServer", {
                    iceCandidate: event.candidate,
                    iceUserName: userName,
                    didIOffer
                });
            }
        });

        peerConnection.ontrack = (event: RTCTrackEvent) => {
            event.streams[0].getTracks().forEach( track => {
                remoteStream.addTrack(track)
            });
        }

        if(offerObj) {
            await peerConnection.setRemoteDescription(offerObj.offer)
        }

    }

    const call = async () => {
        await fetchUserMedia();
        await createPeerConnection();

        try{
            const peerConnection = peerConnectionRef.current;
            if(peerConnection) {
                const offer = await peerConnection.createOffer();
                console.log("Create Offer", offer);
                didIOffer.current = true;
                console.log("ser Did i offer ", didIOffer)
                await peerConnection.setLocalDescription(offer);
                socket?.emit("newOffer", offer);
            }
        } catch (err) {
            console.log("Error while call: ", err);
        }
    }

    const answerOffer = async (offerObj: any) => {
        await fetchUserMedia();
        await createPeerConnection(offerObj);
        
        try {
            const peerConnection = peerConnectionRef.current;
            if(peerConnection) {
                const answer = await peerConnection.createAnswer({});
                await peerConnection.setLocalDescription(answer);
                offerObj.answer = answer;
                const offerIceCandidates = await socket?.emitWithAck("newAnswer", offerObj);
                console.log("Offer ICE Candidate", offerIceCandidates[0])
                offerIceCandidates.forEach( (c: RTCIceCandidate) => {
                    peerConnection.addIceCandidate(c);
                    console.log("============== Added Ice Candidates ==============")
                });
            }
        } catch (error) {
            console.log("Error when creating answer: ", error);
        }

    }

    // const addAnswer = async (offerObj: any) => {
    //     await peerConnectionRef.current?.setRemoteDescription(offerObj.answer);
    // }

    // const addNewIceCandidates = (iceCandidate: RTCIceCandidate) => {
    //     peerConnectionRef.current?.addIceCandidate(iceCandidate);
    // };

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