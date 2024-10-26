import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

const URL = "http://localhost:3000";

export default function Room() {
    const [searchParam] = useSearchParams();
    const name = searchParam.get("name");
    const age = searchParam.get("age");
    const [socket, setSocket] = useState<null | Socket>(null);
    const [socketId, setSocketId] = useState<String | null>(null);

    useEffect(() => {
        const socketInstance = io(URL);
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            setSocketId(socketInstance.id || null);
        });
        // Cleanup on unmount

        return () => {
            socketInstance.disconnect();
        };
    }, []); // Empty dependency array ensures this runs once on mount

    return (
        <>
            <h1> Hi {name}!! You look good for {age}</h1>
            <p>{`This is your socket ${socketId}`}</p>
        </>
    );
}
