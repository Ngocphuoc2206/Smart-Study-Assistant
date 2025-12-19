/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

//Create Socket
export function initSocket(httpServer: any){
    io = new Server(httpServer, {
        cors: { origin: "*", credentials: true}
    });

    io.use((socket, next) => {
        try{
            const token = socket.handshake.auth?.token || (socket.handshake.headers.authorization || "").replace("Bearer ", "");
            if (!token) return next(new Error("Unauthorized"));
            const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
            socket.data.userId = payload.userId || payload.id;
            return next();
        }catch{
            return next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        if (userId) socket.join(userId); //Room the userId
    })
    return io;
}

export function getIO(){
    if (!io) throw new Error("Socket.io not initialized");
    return io;
}

