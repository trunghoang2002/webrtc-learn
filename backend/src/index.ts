
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

    const userName = socket.handshake.query.userName as string;
    console.log(`user connected ${socket.id}`, userName);

    connectedSockets.push({
        socketId: socket.id,
        userName,
    })

    if(offers.length) 
        socket.emit("availableOffers", offers)

   

    socket.on("newOffer", (offer) => {
        offers.push({
            offererUserName: userName,
            offer: offer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
        });

        // console.log("New Offer - offers List", offers)

        socket.broadcast.emit("newOfferAwaiting", offers.slice(-1));
    });

    socket.on("newAnswer", (offerObj, ackFunction) => {
        // console.log(offerObj);
        const socketToAnswer = connectedSockets.find(s => s.userName == offerObj.offererUserName);
        if(!socketToAnswer) {
            console.log("No socket to answer");
            return
        }

        const socketIdToAnswer = socketToAnswer.socketId;

        const offerToUpdate = offers.find(o => o.offererUserName == offerObj.offererUserName);
        if(!offerToUpdate) {
            console.log("No offer to update")
            return
        }

        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer
        offerToUpdate.answererUserName = userName

        socket.to(socketIdToAnswer).emit("answerResponse", offerObj);
    });

    socket.on("sendIceCandidatesToSignallingServer", (iceCandidateObj) => {
        
        const {iceCandidate, iceUserName, didIOffer} = iceCandidateObj;
        
        // console.log("sendIceCandidatesToSignallingServer Did I ofer ", didIOffer, iceCandidate)

        if(didIOffer) {
            
            const offerInOffers = offers.find(o=>o.offererUserName === iceUserName);
        
            if(offerInOffers){
                offerInOffers.offerIceCandidates.push(iceCandidate)
                // 1. When the answerer answers, all existing ice candidates are sent
                // 2. Any candidates that come in after the offer has been answered, will be passed through
                if(offerInOffers.answererUserName){
                    //pass it through to the other socket
                    const socketToSendTo = connectedSockets.find(s=>s.userName === offerInOffers.answererUserName);
                    if(socketToSendTo){
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
                    }else{
                        console.log("Ice candidate recieved but could not find answere")
                    }
                }
                console.log("got ICE candidates from the user", offerInOffers.offererUserName, iceCandidateObj)
            }
        } else {
             //this ice is coming from the answerer. Send to the offerer
            //pass it through to the other socket
            const offerInOffers = offers.find(o=>o.answererUserName === iceUserName);
            if(offerInOffers){
                const socketToSendTo = connectedSockets.find(s=>s.userName === offerInOffers.offererUserName);
                if(socketToSendTo){
                    socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
                }else{
                    console.log("Ice candidate recieved but could not find offerer")
                }
            }
        }
    });

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
