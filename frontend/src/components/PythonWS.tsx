import { useEffect } from "react"

export default function PythonWS() {
    
    useEffect(() => {
        const socket = new WebSocket("ws://localhost/ws");

        socket.onopen = () => {
            console.log("WebSocket connection established");
        };

        socket.onmessage = (event) => {
            console.log("Message from server:", event.data);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socket.close();
        };
    }, [])

    return (
        <>
            <h1>Python Websocket</h1>
        </>
    )
}