//Realtime speech to text based on the audio

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3000"

export default function Video() {
    const [_, setSocket] = useState<Socket | null>(null);
    const [socketId, setSocketId] = useState("");

    useEffect(()=> {
        const socketInstance = io(URL)
        setSocket(socketInstance)

        socketInstance.on("connect", () => {
            setSocketId(socketInstance.id!)
            console.log("Connected to socket ", socketInstance.id );
        });

        return () => {
            console.log("Disconnected")
            socketInstance.disconnect()
        }
    }, []);

    return (
        <>
        <h1> Connected with Socket Id: {socketId} </h1>
        </>
    )
}