"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = require("underscore");
const ws_1 = __importDefault(require("ws"));
const Define_1 = require("./lib/Define");
const Util_1 = require("./lib/Util");
const proxy_1 = require("./proxy");
class RpcClient {
    constructor() {
        this.rpcModuleMap = {};
        this.connected = false;
        this.rpcServerUrl = '';
        this.getAllRpcMethodRoute = 'RpcServer/GetAllRpcMethod';
        this._protocol = Define_1.ProtocolTypes.http;
        this._reqIdIndex = 1;
        this._wsRequest = {};
        this.rpc = {};
    }
    static getInstance() {
        if (!RpcClient.instance) {
            RpcClient.instance = new RpcClient();
        }
        return RpcClient.instance;
    }
    serverType(type) {
        if (underscore_1.isUndefined(type)) {
            return this._protocol;
        }
        if (!Define_1.ProtocolTypes[type]) {
            throw new Error(`Client: type=${type}, type must be element in ${Define_1.ProtocolTypes}`);
        }
        this._protocol = type;
        return this;
    }
    initClient(url, getAllRpcMethodRoute) {
        const self = this;
        this.rpc = {};
        this.getAllRpcMethodRoute = getAllRpcMethodRoute || this.getAllRpcMethodRoute;
        if (!url) {
            return Promise.reject(new Error('RpcClient: You must provide a rpc server url!!!'));
        }
        this.rpcServerUrl = url;
        if (this._protocol === Define_1.ProtocolTypes.webSocket) {
            if (this._socket) {
                return Promise.reject(new Error('RpcClient: client socket has already exist'));
            }
            this._socket = new ws_1.default(this.rpcServerUrl);
            this._socket.on('message', (msg) => {
                msg = JSON.parse(msg);
                if (!this._wsRequest[msg.reqId]) {
                    console.error('收到未记录的协议返回:', JSON.stringify(msg));
                    return;
                }
                if (msg.statusCode !== 200) {
                    this._wsRequest[msg.reqId].onFail(msg.data);
                }
                else {
                    this._wsRequest[msg.reqId].onSuccess(msg.data);
                }
            });
            let _resolve, _reject;
            let promise = new Promise((resolve, reject) => {
                _resolve = resolve;
                _reject = reject;
            });
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
        }
        else {
            return this.sendRequest(this.getAllRpcMethodRoute, {}).then((data) => {
                self.rpcModuleMap = data;
                self.initProxy();
                self.connected = true;
                console.log(`RpcClient: Get rpc module-method-list success: ${JSON.stringify(data)}`);
                return self;
            });
        }
    }
    initProxy() {
        for (let mod in this.rpcModuleMap) {
            for (let method of this.rpcModuleMap[mod].methodList) {
                proxy_1.ClientProxy.genProxy(this, mod, method);
            }
        }
        return this;
    }
    rpcFunction(moduleName, method, ...params) {
        if (!this.connected) {
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
        if (this._protocol === Define_1.ProtocolTypes.webSocket && !this._socket) {
            return Promise.reject(new Error(`RpcClient: client socket is not initialized.`));
        }
        return this.sendRequest(`${moduleName}/${method}`, params);
    }
    sendRequest(route, params) {
        if (this._protocol === Define_1.ProtocolTypes.http) {
            return Util_1.promiseRequest({
                url: `${this.rpcServerUrl}/${route}`,
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: params
            });
        }
        else {
            return new Promise((resolve, reject) => {
                const index = this._reqIdIndex++;
                const reqMsg = {
                    reqId: index,
                    body: params,
                    route: route
                };
                this._socket.send(JSON.stringify(reqMsg));
                this._wsRequest[index] = Object.assign(Object.assign({}, reqMsg), { onSuccess: resolve, onFail: reject });
            });
        }
    }
}
exports.RpcClient = RpcClient;
RpcClient.instance = null;
//# sourceMappingURL=RpcClient.js.map