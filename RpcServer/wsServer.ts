import _ = require('underscore');
import { IModuleIntroduce, IProcessStartMsg, ISocketRequestMsg, ISocketResponseMsg } from './lib/Define';
import WebSocket = require('ws');

export class WSServer {
    private _server: WebSocket.Server;
    /**rpc模块 */
    private rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    /**websocket 服务器 端口, 主线程传递 */
    private port;
    /**RPC客户端调用服务端所有rpc模块和方法的路由 主线程传递*/
    private getAllRpcMethodRoute;

    initParam(data: IProcessStartMsg): WSServer {
        this.rpcModuleMap = data.rpcModuleMap;
        this.port = data.port;
        this.getAllRpcMethodRoute = data.route;
        return this;
    }

    initWS(): void {
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
                socket.on('message', async (message: any) => {
                    message = <ISocketRequestMsg>JSON.parse(message)
                    console.log(`RpcServer-wsServer: web socket server get a rpc request from IP:${req.socket.remoteAddress}, url=${message.route}, params=${JSON.stringify(message.body)}`);
                    const responseMsg: ISocketResponseMsg = {
                        reqId: message.reqId,
                        statusCode: 200
                    }
                    try {
                        const arguement = message.body;
                        if (message.route.search(this.getAllRpcMethodRoute) !== -1) {
                            responseMsg.data = this.rpcModuleMap;
                            socket.send(JSON.stringify(responseMsg));
                        } else {
                            const [moduleName, method] = message.route.split('/');
                            if (!modObjMap[moduleName] || !modObjMap[moduleName][method]) {
                                responseMsg.statusCode = 404;
                                responseMsg.data = '找不到对应路由';
                                socket.send(JSON.stringify(responseMsg));
                            }
                            const result = await modObjMap[moduleName][method].call(modObjMap[moduleName], ...arguement);
                            responseMsg.data = result;
                            socket.send(JSON.stringify(responseMsg));
                        }
                    } catch(err) {
                        console.log(`RpcServer-wsServer: rpc服务器错误 ${message.route} failed, argument=${JSON.stringify(message.body)}, err: ${err.stack}`);
                        responseMsg.statusCode = 500;
                        responseMsg.data = 'rpc服务器错误';
                        socket.send(JSON.stringify(responseMsg));
                    }
                });
            });
        }
        console.log(`RpcServer-wsServer: websocket server is running in localhost:${this.port}`);
        if (process.send) {
            process.send({type: 'start', data: ''});
        }
    }

    close() {
        this._server && this._server.close();
        console.log(`RpcServer-wsServer: 关闭rpc websocket 服务器`);
    }
}

