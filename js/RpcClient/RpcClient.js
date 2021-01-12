"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("./lib/Util");
var proxy_1 = require("./proxy");
var RpcClient = /** @class */ (function () {
    function RpcClient() {
        this.rpcModuleMap = {};
        /**是否跟服务器连接成功, 仅在成功获取rpc方法列表才算连接成功 */
        this.connected = false;
        this.rpcServerUrl = '';
        this.rpc = {};
    }
    RpcClient.getInstance = function () {
        if (!RpcClient.instance) {
            RpcClient.instance = new RpcClient();
        }
        return RpcClient.instance;
    };
    RpcClient.prototype.initClient = function (url, basicRoute) {
        var self = this;
        this.rpc = {};
        basicRoute = basicRoute || '/RpcServer/GetAllRpcMethod';
        if (!url) {
            throw new Error('RpcClient: You must provide a rpc server url!!!');
        }
        this.rpcServerUrl = url;
        return Util_1.promiseRequest({
            url: this.rpcServerUrl + basicRoute,
            method: 'POST'
        }).then(function (result) {
            if (result.statusCode !== 200) {
                console.error("RpcClient: Can not get correct respose from RpcServer: " + self.rpcServerUrl + " when reqeust module-method-list");
            }
            else {
                self.rpcModuleMap = result.data;
                self.initProxy();
                self.connected = true;
                console.log("RpcClient: Get rpc module-method-list success: " + JSON.stringify(result.data));
            }
            return self;
        }).catch(this.errorHandler);
    };
    RpcClient.prototype.initProxy = function () {
        for (var mod in this.rpcModuleMap) {
            for (var _i = 0, _a = this.rpcModuleMap[mod].methodList; _i < _a.length; _i++) {
                var method = _a[_i];
                proxy_1.ClientProxy.genProxy(this, mod, method);
            }
        }
        return this;
    };
    RpcClient.prototype.rpcFunction = function (moduleName, method) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        if (!this.connected) {
            throw new Error('RpcClient: RpcClient is not connected.');
        }
        if (!this.rpcModuleMap[moduleName]) {
            throw new Error("RpcClient: RpcServer not provide module: " + moduleName + ", please comfrim RpcClient initialize success or RpcServer own this module");
        }
        if (Object.prototype.toString.call(this.rpcModuleMap[moduleName].methodList) !== '[object Array]') {
            throw new Error("RpcClient: methodList of module " + moduleName + " by RpcServer is not an array!!!");
        }
        if (this.rpcModuleMap[moduleName].methodList.indexOf(method) === -1) {
            throw new Error("RpcClient: module " + moduleName + " no such function: " + method);
        }
        return Util_1.promiseRequest({
            url: this.rpcServerUrl + "/" + moduleName + "/" + method,
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json',
            },
            body: params
        });
    };
    RpcClient.prototype.errorHandler = function (e) {
        this.connected = false;
        console.warn('RpcClient: initialize RpcClient rpcModuleMap failed.');
        console.error(e.stack);
        return this;
    };
    RpcClient.instance = null;
    return RpcClient;
}());
exports.RpcClient = RpcClient;
