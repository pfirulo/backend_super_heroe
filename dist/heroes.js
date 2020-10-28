"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TIME_OUT = 10000;
class SuperHeroes {
    constructor() {
        this.data = new Map();
        this.requests = new Map();
        // initialize the superheroes
        const tmp = [
            {
                name: "Super-Man",
                avatar: "https://superherotar.framiq.com/assets/examples/superherotar00.png",
                isTaken: false,
                inCall: false
            },
            {
                name: "Iron-Man",
                avatar: "https://superherotar.framiq.com/assets/examples/superherotar05.png",
                isTaken: false,
                inCall: false
            },
            {
                name: "Bat-Man",
                avatar: "https://superherotar.framiq.com/assets/examples/superherotar02.png",
                isTaken: false,
                inCall: false
            },
            {
                name: "Wonder-Woman",
                avatar: "https://superherotar.framiq.com/assets/examples/superherotar01.png",
                isTaken: false,
                inCall: false
            },
            {
                name: "Black-Widow",
                avatar: "https://superherotar.framiq.com/assets/examples/superherotar07.png",
                isTaken: false,
                inCall: false
            },
            {
                name: "Elektra",
                avatar: "https://superherotar.framiq.com/assets/examples/superherotar06.png",
                isTaken: false,
                inCall: false
            }
        ];
        tmp.forEach((item) => {
            this.data.set(item.name, item);
        });
    }
    listOfSuperHeroes() {
        let obj = Array.from(this.data).reduce((obj, [key, value]) => Object.assign(obj, { [key]: value }), // Be careful! Maps can have non-String keys; object literals can't.
        {});
        return obj;
    }
    getSuperHero(superHeroName) {
        if (this.data.has(superHeroName)) {
            return this.data.get(superHeroName);
        }
        return null;
    }
    assignSuperHero(io, socket, superHeroName) {
        let superHero = this.getSuperHero(superHeroName); // get the super hero by name
        if (superHero) {
            // if the super hero is inside the superHeroes map
            if (!superHero.isTaken) {
                //if the super hero is available
                superHero.isTaken = true;
                this.data.set(superHeroName, superHero); // update the super hero availability
                socket.handshake.query.superHeroAssiged = superHeroName;
                socket.join(superHeroName); // join the socket to one room with the superhero name
                // We inform to the user that a superhero has been assigned
                io.to(socket.id).emit("on-assigned", superHeroName);
                //We inform other users that a superhero has been taken
                socket.broadcast.emit("on-taken", superHeroName);
            }
            else {
                // We inform to the user that the requested super hero is not available
                io.to(socket.id).emit("on-assigned", null);
            }
        }
    }
    enabledAgain(io, superHeroName) {
        // if the user disconneted has a super hero assigned
        let superHero = this.getSuperHero(superHeroName); // get the super hero by name
        if (superHero) {
            // if the super hero is inside the superHeroes map
            superHero.isTaken = false;
            this.data.set(superHeroName, superHero); // update the superhero availability
        }
        io.emit("on-disconnected", superHeroName); // We inform other users that a superhero has been disconnected
    }
    requestCall(requestData) {
        console.log("request to ", requestData.callee);
        let superHero = this.getSuperHero(requestData.callee); // get the super hero by name
        // if the super hero is inside the superHeroes map and he can take a call
        if (superHero && !superHero.inCall && superHero.isTaken) {
            // get the name of the superHero that is request the call
            const { superHeroAssiged } = requestData.socket.handshake.query;
            if (superHeroAssiged) {
                // We inform the user that another wants to connect for a call
                const requestId = `${requestData.callee}_${Date.now()}`; // create a requestId
                const timeOutId = setTimeout(() => {
                    // after the TIME_OUT and the user does not send an answer to this request
                    // We inform the requesting user that the call was not taken
                    requestData.io.to(requestData.socket.id).emit("on-response", null);
                    requestData.io.to(requestData.callee).emit("on-cancel-request");
                    this.deleteRequest(requestId);
                }, TIME_OUT);
                // saves the request into map
                this.requests.set(requestId, {
                    createdAt: new Date(),
                    timeOutId,
                    superHeroName: superHeroAssiged
                });
                requestData.socket.join(requestId);
                requestData.socket.handshake.query.requestId = requestId; //save the requestId in my socket handshake.query
                console.log("calling to ", requestData.callee);
                // emit data to the requested user
                requestData.io.to(requestData.callee).emit("on-request", {
                    superHeroName: superHeroAssiged,
                    offer: requestData.offer,
                    requestId
                });
            }
        }
        else {
            console.log("superhero is not available to call");
            // We inform to the user that the requested superhero is not available to take the call
            requestData.io.to(requestData.socket.id).emit("on-response", null);
        }
    }
    cancelRequest(io, socket) {
        const { requestId } = socket.handshake.query;
        console.log("cancelRequest " + requestId);
        if (requestId) {
            this.deleteRequest(requestId);
            const superHeroCalled = requestId.split("_")[0];
            socket.handshake.query.requestId = null;
            console.log("cancel", superHeroCalled);
            io.to(superHeroCalled).emit("on-cancel-request");
        }
    }
    deleteRequest(requestId) {
        if (this.requests.has(requestId)) {
            const request = this.requests.get(requestId);
            clearTimeout(request.timeOutId);
            this.requests.delete(requestId);
        }
    }
    reponseToRequest(responseData) {
        if (this.requests.has(responseData.requestId)) {
            const request = this.requests.get(responseData.requestId);
            const createdAt = request.createdAt; //request createdAt date
            const superHeroName = request.superHeroName; // the superhero name that requested the call
            const currentDate = new Date(); //current date
            const difference = (currentDate.getTime() - createdAt.getTime()) / 1000; //diference in seconds
            this.deleteRequest(responseData.requestId);
            // if the user answer to the request before the TIME_OUT
            if (TIME_OUT - difference >= 1) {
                // get the name of the superHero that is sending the response to the call
                const { superHeroAssiged } = responseData.socket.handshake.query;
                if (superHeroAssiged) {
                    // get the requesting super hero
                    const requestingSuperHero = this.getSuperHero(superHeroName);
                    // if the requesting super hero can take the call
                    if (requestingSuperHero && !requestingSuperHero.inCall) {
                        if (responseData.answer) {
                            let me = this.getSuperHero(superHeroName);
                            me.inCall == true;
                            this.data.set(me.name, me); // the superhero is in calling
                            // if the callee accept the call
                            responseData.socket.join(responseData.requestId);
                            responseData.socket.handshake.query.requestId =
                                responseData.requestId;
                            // We send to the requesting user the response to the previous request
                            responseData.io
                                .to(superHeroName)
                                .emit("on-response", responseData.answer);
                        }
                        else {
                            responseData.io.to(superHeroName).emit("on-response", null);
                        }
                    }
                }
            }
        }
    }
    finishCall(io, socket, isDisconnected = false) {
        const { requestId } = socket.handshake.query;
        if (requestId) {
            if (isDisconnected) {
                io.to(requestId).emit("on-finish-call"); // we inform to the other hero that call is finished
            }
            else {
                socket.broadcast.to(requestId).emit("on-finish-call"); // we inform to the other hero that call is finished
            }
            // for (const id in io.sockets.in(requestId).sockets) {
            //   io.nsps.clients.connected[id].leave(requestId);
            //   io.nsps.clients.connected[id].handshake.query.requestId = null;
            // }
        }
    }
}
exports.default = SuperHeroes;
