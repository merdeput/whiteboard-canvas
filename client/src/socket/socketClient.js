import { io } from "socket.io-client";
let socket = null;

export function getSocket(){
    return socket;
}

export function disconnectSocket(){
    if(!socket)
        return;
    socket.disconnect();
    socket = null;
}

export function connectSocket(token) {
    if(socket) 
        return socket;

    socket = io(import.meta.env.VITE_SERVER_URL, {
        autoConnect: false,
        auth: {
            token,
        },
    });

    socket.connect();
    return socket;
}