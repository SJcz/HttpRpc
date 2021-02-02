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
const WebSocket = require("ws");
class WSServer {
    constructor() {
        this.rpcModuleMap = {};
    }
    initParam(data) {
        this.rpcModuleMap = data.rpcModuleMap;
        this.port = data.port;
        this.getAllRpcMethodRoute = data.route;
        return this;
    }
    initWS() {
        console.log('RpcServer-wsServer: start initialzing websocket server(ws)');
        const modObjMap = {};
        for (let moduleName in this.rpcModuleMap) {
            const modObj = require(this.rpcModuleMap[moduleName].filePath);
            if (!modObj) {
                console.warn(`RpcServer-wsServer: require ${this.rpcModuleMap[moduleName].filePath}, but can not find ${this.rpcModuleMap[moduleName].filePath} when require. `);
                return;
            }
            modObjMap[moduleName] = modObj;
        }
        if (!this._server) {
            this._server = new WebSocket.Server({ port: this.port });
            this._server.on('connection', (socket, req) => {
                socket.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                    message = JSON.parse(message);
                    console.log(`RpcServer-wsServer: web socket server get a rpc request from IP:${req.socket.remoteAddress}, url=${message.route}, params=${JSON.stringify(message.body)}`);
                    const responseMsg = {
                        reqId: message.reqId,
                        statusCode: 200
                    };
                    try {
                        const arguement = message.body;
                        if (message.route.search(this.getAllRpcMethodRoute) !== -1) {
                            responseMsg.data = this.rpcModuleMap;
                            socket.send(JSON.stringify(responseMsg));
                        }
                        else {
                            const [moduleName, method] = message.route.split('/');
                            if (!modObjMap[moduleName] || !modObjMap[moduleName][method]) {
                                responseMsg.statusCode = 404;
                                responseMsg.data = '找不到对应路由';
                                socket.send(JSON.stringify(responseMsg));
                            }
                            const result = yield modObjMap[moduleName][method].call(modObjMap[moduleName], ...arguement);
                            responseMsg.data = result;
                            socket.send(JSON.stringify(responseMsg));
                        }
                    }
                    catch (err) {
                        console.log(`RpcServer-wsServer: rpc服务器错误 ${message.route} failed, argument=${JSON.stringify(message.body)}, err: ${err.stack}`);
                        responseMsg.statusCode = 500;
                        responseMsg.data = 'rpc服务器错误';
                        socket.send(JSON.stringify(responseMsg));
                    }
                }));
            });
        }
        console.log(`RpcServer-wsServer: websocket server is running in localhost:${this.port}`);
        if (process.send) {
            process.send({ type: 'start', data: '' });
        }
    }
    close() {
        this._server && this._server.close();
        console.log(`RpcServer-wsServer: 关闭rpc websocket 服务器`);
    }
}
exports.WSServer = WSServer;
//# sourceMappingURL=wsServer.js.map