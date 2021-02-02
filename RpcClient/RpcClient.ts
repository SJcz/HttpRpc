import { isUndefined } from 'underscore';
import WebSocket from 'ws';
import { IModuleIntroduce, ProtocolTypes, ISocketRequestMsg, ISocketResponseMsg } from './lib/Define';
import { promiseRequest } from './lib/Util';
import { ClientProxy } from './proxy';

export class RpcClient {
    private static instance: RpcClient | null = null;

    /**服务器提供的rpc路由, 客户端需要在发送rpc请求之前检查rpc路由是否有效 */
    private rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    

    /**是否跟服务器连接成功, 仅在成功获取rpc方法列表才算连接成功 */
    private connected = false;
    /**rpc服务器的基础url */
    private rpcServerUrl = '';
     /**获取服务端所有rpc模块和方法的路由 */
     private getAllRpcMethodRoute: string = 'RpcServer/GetAllRpcMethod';
    /**底层使用的协议类型 */
    private _protocol: ProtocolTypes = ProtocolTypes.http;

    /**请求索引 */
    private _reqIdIndex = 1;
    /**所有还未收到答复的web socket 请求 */
    private _wsRequest: {[index: number]: ISocketRequestMsg } = {};
    /**连接到ws服务器的客户端socket */
    private _socket: WebSocket;
   
    public rpc: RpcModule = {};

    static getInstance(): RpcClient {
        if (!RpcClient.instance) {
            RpcClient.instance = new RpcClient();
        }
        return RpcClient.instance;
    }

    /**设置或者获取底层的服务器类型 */
    serverType(type?: ProtocolTypes): ProtocolTypes | RpcClient {
        if (isUndefined(type)) {
            return this._protocol;
        } 
        if (!ProtocolTypes[type]) {
            throw new Error(`Client: type=${type}, type must be element in ${ProtocolTypes}`);
        }
        this._protocol = type;
        return this;
    } 

    initClient (url: string, getAllRpcMethodRoute?: string): Promise<RpcClient> {
        const self = this;
        this.rpc = {};
        this.getAllRpcMethodRoute = getAllRpcMethodRoute || this.getAllRpcMethodRoute;
        if (!url) {
            return Promise.reject(new Error('RpcClient: You must provide a rpc server url!!!'));
        }
        this.rpcServerUrl = url;
        if (this._protocol === ProtocolTypes.webSocket) {
            if (this._socket) {
                return Promise.reject(new Error('RpcClient: client socket has already exist'));
            }
            this._socket = new WebSocket(this.rpcServerUrl);
            this._socket.on('message', (msg: any) => {
                msg = <ISocketResponseMsg>JSON.parse(msg);
                if (!this._wsRequest[msg.reqId]) {
                    console.error('收到未记录的协议返回:', JSON.stringify(msg));
                    return;
                }
                if (msg.statusCode !== 200) {
                    this._wsRequest[msg.reqId].onFail(msg.data);
                } else {
                    this._wsRequest[msg.reqId].onSuccess(msg.data);
                }
            });
            let _resolve, _reject;
            let promise = new Promise<RpcClient>((resolve, reject) => {
                _resolve = resolve;
                _reject = reject;
            })
            this._socket.on('open', () => {
                this.sendRequest(this.getAllRpcMethodRoute, {}).then((data) => {
                    self.rpcModuleMap = data;
                    self.initProxy();
                    self.connected = true;
                    console.log(`RpcClient: Get rpc module-method-list success: ${JSON.stringify(data)}`);
                    return _resolve(this);
                }).catch(_reject);
            });
            return promise;
        } else {
            return this.sendRequest(this.getAllRpcMethodRoute, {}).then((data) => {
                self.rpcModuleMap = data;
                self.initProxy();
                self.connected = true;
                console.log(`RpcClient: Get rpc module-method-list success: ${JSON.stringify(data)}`);
                return self;
            });
        }
    }

    initProxy(): RpcClient {
        for (let mod in this.rpcModuleMap) {
            for (let method of this.rpcModuleMap[mod].methodList) {
                ClientProxy.genProxy(this, mod, method);
            }
        }
        return this;
    }

    rpcFunction (moduleName: string, method: string, ...params: any): Promise<any> {
        if(!this.connected) {
            return Promise.reject(new Error('RpcClient: RpcClient is not connected.'));
        }
        if (!this.rpcModuleMap[moduleName]) {
            return Promise.reject(new Error(`RpcClient: RpcServer not provide module: ${moduleName}, please comfrim RpcClient initialize success or RpcServer own this module`));
        }
        if (Object.prototype.toString.call(this.rpcModuleMap[moduleName].methodList) !== '[object Array]') {
            return Promise.reject(new Error(`RpcClient: methodList of module ${moduleName} by RpcServer is not an array!!!`));
        }
        if (this.rpcModuleMap[moduleName].methodList.indexOf(method) === -1) {
            return Promise.reject(new Error(`RpcClient: module ${moduleName} no such function: ${method}`));
        }
        if (this._protocol === ProtocolTypes.webSocket && !this._socket) {
            return Promise.reject(new Error(`RpcClient: client socket is not initialized.`))
        }
        return this.sendRequest(`${moduleName}/${method}`, params);
    }

    private sendRequest(route: string, params: any): Promise<any> {
        if (this._protocol === ProtocolTypes.http) {
            return promiseRequest({
                url: `${this.rpcServerUrl}/${route}`,
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: params
            });
        } else {
            return new Promise((resolve, reject) => {
                const index = this._reqIdIndex++;
                const reqMsg = {
                    reqId: index,
                    body: params,
                    route: route
                }
                this._socket.send(JSON.stringify(reqMsg));
                this._wsRequest[index] = {...reqMsg, onSuccess: resolve, onFail: reject};
            });
        }
    }
}
