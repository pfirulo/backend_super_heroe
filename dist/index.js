"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const dotenv_1 = __importDefault(require("dotenv"));
const ws_1 = __importDefault(require("./ws"));
dotenv_1.default.config();
const app = express_1.default();
const server = new http_1.default.Server(app);
ws_1.default(socket_io_1.default(server));
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`running on ${PORT}`);
    //every 5 minutes
    // setInterval(() => {
    //   axios.get("https://backend-super-hero-call.herokuapp.com");
    // }, 1000 * 60 * 5);
});
