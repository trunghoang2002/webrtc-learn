
import { createServer } from "http";
import { Server, Socket } from "socket.io";
// import express from 'express'

const httpServer =  createServer();
const io = new Server(httpServer, {
    cors:{
        origin: "*"
    }
});

interface Offer {
    offererUserName: string;
    offer: any; // or whatever type `offer` should be
    offerIceCandidates: any[]; // replace `any` with the correct type if possible
    answererUserName: string | null;
    answer: any; // or whatever type `answer` should be
    answererIceCandidates: any[]; // replace `any` with the correct type if possible
}

const offers: Offer[] = [
    //offerUserName
    //offer
    //offerIceCandidates
    //answerUsername
    //answer
    //answerIceCandidates
]

const connectedSockets: any[] = [
    //userName socketId
]

io.on("connection", (socket: Socket) => {

});



httpServer.listen(3000, () => {
    console.log("listening on port 3000");
});
