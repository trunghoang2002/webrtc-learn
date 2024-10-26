import { createServer } from "http";
import { Server, Socket } from "socket.io";

const httpServer =  createServer();
const io = new Server(httpServer, {
    cors:{
        origin: "*"
    }
});

io.on("connection", (socket: Socket) => {
    console.log(`user connected ${socket.id}`);
});

httpServer.listen(3000, () => {
    console.log("listening on port 3000");
});
