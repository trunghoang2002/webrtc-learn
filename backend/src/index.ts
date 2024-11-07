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

  socket.on("disconnect", (reason) => {
    console.log("Disconnected socket: ", socket.id, reason );
  });
  
});

httpServer.listen(3000);