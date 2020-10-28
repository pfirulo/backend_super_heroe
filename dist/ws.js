"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroes_1 = __importDefault(require("./heroes"));
const superHeroes = new heroes_1.default();
exports.default = (io) => {
    io.on("connection", (socket) => {
        io.to(socket.id).emit("on-connected", superHeroes.listOfSuperHeroes());
        // a user requests a super hero as a user
        socket.on("pick", (superHeroName) => superHeroes.assignSuperHero(io, socket, superHeroName));
        socket.on("request", ({ superHeroName, offer }) => superHeroes.requestCall({
            io,
            socket,
            callee: superHeroName,
            offer
        }));
        socket.on("cancel-request", () => superHeroes.cancelRequest(io, socket));
        socket.on("response", ({ requestId, answer = null }) => superHeroes.reponseToRequest({ io, socket, requestId, answer }));
        socket.on("candidate", ({ him, candidate }) => {
            socket.broadcast.to(him).emit("on-candidate", candidate);
        });
        socket.on("finish-call", () => superHeroes.finishCall(io, socket, false));
        // if the current socket has been disconnected
        socket.on("disconnect", () => {
            const { superHeroAssiged } = socket.handshake.query;
            if (superHeroAssiged) {
                console.log("disconnected", superHeroAssiged);
                superHeroes.cancelRequest(io, socket);
                superHeroes.finishCall(io, socket, true);
                socket.handshake.query.superHeroAssiged = null;
                superHeroes.enabledAgain(io, superHeroAssiged);
            }
        });
    });
};
