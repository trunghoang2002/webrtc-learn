"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*"
    }
});
const fetchUserMedia = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const stream = yield navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            resolve(stream);
        }
        catch (error) {
            console.log(error);
            reject(error);
        }
    }));
};
io.on("connection", (socket) => {
    console.log(`user connected ${socket.id}`);
    socket.on("clientMsg", (msg) => {
        console.log(`Client mag: ${msg}`);
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
