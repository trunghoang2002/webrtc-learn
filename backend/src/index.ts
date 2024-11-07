import  express  from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

io.on("connection", (socket: Socket) => {
  console.log("Connected Socket: ", socket.id);
});

httpServer.listen(3000);