//Realtime speech to text based on the audio

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3000"

export default function Video() {
    const [_, setSocket] = useState<Socket | null>(null);

    useEffect(()=> {
        const socketInstance = io(URL)
        setSocket(socketInstance)

        socketInstance.on("connection", () => {
            console.log("Connected to socket ", socketInstance.id );
        });

        return () => {
            console.log("unmount")
        }
    }, []);

    return (
        <>
        <h1> This is the Video Page </h1>
        </>
    )
}