import { createServer } from "http";
import { Server, Socket } from "socket.io";

const httpServer =  createServer();
const io = new Server(httpServer, {
    cors:{
        origin: "*"
    }
});

const fetchUserMedia = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const stream =  await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            resolve(stream);
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

io.on("connection", (socket: Socket) => {
    console.log(`user connected ${socket.id}`);

    socket.on("clientMsg", (msg: string) => {
        console.log(`Client mag: ${msg}`)
        io.emit("server-reply", `Got msg from the client ${msg}`);
    });

    //Create code for webrtc
    //Offer - get offer form the user
    //send offer to the agent
    //send ans to the user
    //connect
    socket.on("offerFromClient", offerFromClient => {
        socket.broadcast.emit("offerFromPeer", offerFromClient);
    });



    //Commit for today

});



httpServer.listen(3000, () => {
    console.log("listening on port 3000");
});
