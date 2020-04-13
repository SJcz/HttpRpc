"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("./lib/Util");
var RpcClient = /** @class */ (function () {
    function RpcClient() {
        this.rpcModuleMap = {};
        this.isInitializing = false;
        this.rpcServerUrl = '';
        // 无论是使用 getInstance 还是 new 创建，保证都是同一个对象
        if (!RpcClient.instance) {
            RpcClient.instance = this;
        }
        return RpcClient.instance;
    }
    RpcClient.getInstance = function () {
        if (!RpcClient.instance) {
            RpcClient.instance = new RpcClient();
        }
        return RpcClient.instance;
    };
    RpcClient.prototype.init = function (url) {
        var _this = this;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var self = this;
        this.isInitializing = true;
        if (!url) {
            this.isInitializing = false;
            throw new Error('RpcClient: You must provide a rpc server url!!!');
        }
        this.rpcServerUrl = url;
        Util_1.promiseRequest({
            url: this.rpcServerUrl + '/RpcServer/GetAllRpcMethod',
            method: 'POST'
        }).then(function (result) {
            _this.isInitializing = false;
            if (result.statusCode !== 1) {
                return console.warn("RpcClient: Can not get correct respose from RpcServer: " + self.rpcServerUrl + " when reqeust module-method-list");
            }
            if (result.statusCode === 1) {
                self.rpcModuleMap = result.data;
                console.log("RpcClient: Get rpc module-method-list success: " + typeof result.data);
                console.log("RpcClient: Get rpc module-method-list success: " + JSON.stringify(result.data));
            }
        }).catch(this.errorHandler);
        return this;
    };
    RpcClient.prototype.rpcFunction = function (moduleName, method, params) {
        if (this.isInitializing) {
            throw new Error('RpcClient: RpcClient is initializing.');
        }
        if (!this.rpcModuleMap[moduleName]) {
            throw new Error("RpcClient: RpcServer not provide module: " + moduleName + ", please comfrim RpcClient initialize success or RpcServer own this module");
        }
        if (Object.prototype.toString.call(this.rpcModuleMap[moduleName].methodList) !== '[object Array]') {
            throw new Error("RpcClient: methodList of module " + moduleName + " by RpcServer is not an array!!!");
        }
        if (this.rpcModuleMap[moduleName].methodList.indexOf(method) === -1) {
            throw new Error("RpcClient: module " + moduleName + " no such function: method");
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
        this.isInitializing = false;
        console.warn('RpcClient: initialize RpcClient rpcModuleMap failed.');
        console.error(e.stack);
    };
    RpcClient.instance = null;
    return RpcClient;
}());
exports.RpcClient = RpcClient;
