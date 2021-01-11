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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-undef */
var express = require("express");
var bodyParser = require("body-parser");
var _ = require("underscore");
/**不是期待的数据类型 */
var UNEXPTECED_TYPE = 'Unexpected Type';
/**http服务器 端口 */
var EXPRESS_PORT = 10008;
/**子进程返回给主进程启动成功 */
var SERVER_SUCCESS = '服务器 rpc 路由添加完成';
/**RPC客户端调用服务端所有rpc模块和方法的路由 */
var GET_ALL_RPC_METHOD = '/RpcServer/GetAllRpcMethod';
var ChildExpress = /** @class */ (function () {
    function ChildExpress() {
        this.app = {};
        this.rpcModuleMap = {};
        this.app = express();
        this.app.use(bodyParser.json());
        this.rpcModuleMap = {};
    }
    ChildExpress.prototype.run = function () {
        this.initProcess();
    };
    ChildExpress.prototype.initProcess = function () {
        console.log('RpcServer: intialize process message | disconnect | exit events');
        process.on('message', this.onMessage.bind(this));
        process.on('disconnect', this.onDisconnect.bind(this));
        process.on('exit', this.onExit.bind(this));
    };
    /**启动express */
    ChildExpress.prototype.initExpress = function () {
        var _this = this;
        console.log('RpcServer: start initialzing express');
        if (!this.app) {
            console.warn('RpcServer: app is not initialized, this is nor normal!!!');
            this.app = express();
            this.app.use(bodyParser.json());
        }
        this.app.use(function (req, res, next) {
            console.log("RpcServer: Get a rpc request from IP:" + req.ip + ", url=" + req.url + ", params=" + JSON.stringify(req.body));
            next();
        });
        this.app.post(GET_ALL_RPC_METHOD, function (req, res) {
            res.json(_this.rpcModuleMap);
        });
        for (var moduleName in this.rpcModuleMap) {
            this.addRoute(moduleName, this.rpcModuleMap[moduleName]);
        }
        this.app.listen(EXPRESS_PORT, function () {
            console.log("RpcServer: server is running in localhost:" + EXPRESS_PORT);
            if (process.send) {
                process.send(SERVER_SUCCESS);
            }
        });
    };
    ChildExpress.prototype.addRoute = function (moduleName, moduleIntroduce) {
        var _this = this;
        if (!this.app) {
            throw new Error('RpcServer: when adding route , find app is not initialized');
        }
        if (Object.prototype.toString.call(moduleIntroduce.methodList) !== '[object Array]') {
            console.warn("RpcServer: methodList of module " + moduleName + " is not a array. please provide a valid array!");
            return;
        }
        // 由于这里无法使用import(namespace和module内部无法使用import), 所以在外面使用import之后再返回回来
        var modObj = require(moduleIntroduce.filePath);
        if (!modObj) {
            console.warn("RpcServer: require " + moduleIntroduce.filePath + ", but can not find " + moduleIntroduce.filePath + " when require. ");
            return;
        }
        var _loop_1 = function (method) {
            console.log("RpcServer: add route | " + moduleName + "/" + method + " | success");
            this_1.app.post("/" + moduleName + "/" + method, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var arguement, result;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            arguement = _.values(req.body);
                            return [4 /*yield*/, (_a = modObj[method]).call.apply(_a, __spreadArrays([null], arguement))];
                        case 1:
                            result = _b.sent();
                            // console.log(`server: ${moduleName}/${method} return value=${JSON.stringify(result)}`);
                            res.json(result);
                            return [2 /*return*/];
                    }
                });
            }); });
        };
        var this_1 = this;
        for (var _i = 0, _a = moduleIntroduce.methodList; _i < _a.length; _i++) {
            var method = _a[_i];
            _loop_1(method);
        }
    };
    /**
     *  一个将任意类型转化为字符串的函数
     * @param anyObj
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ChildExpress.prototype.formatAnyToString = function (anyObj) {
        var type = Object.prototype.toString.call(anyObj);
        switch (type) {
            case '[object object]':
                return JSON.stringify(anyObj);
            case '[object Array]':
                return JSON.stringify(anyObj);
            case '[object String]':
                return anyObj;
            case '[object Number]':
                return String(anyObj);
            case '[object Boolean]':
                return String(anyObj);
            default:
                console.warn("Get an unexpected type: " + type + ", please check your function return");
                return UNEXPTECED_TYPE;
        }
    };
    ChildExpress.prototype.onMessage = function (msgObj) {
        console.log('收到父进程消息', JSON.stringify(msgObj));
        if (msgObj.type === 'start') {
            this.rpcModuleMap = msgObj.rpcModuleMap;
            this.initExpress();
        }
    };
    ChildExpress.prototype.onDisconnect = function () {
        console.log("process " + process.pid + " disconnect.");
    };
    ChildExpress.prototype.onExit = function () {
        console.log("process " + process.pid + " exit.");
    };
    return ChildExpress;
}());
process.on('uncaughtException', function (e) {
    console.log("process " + process.pid + " uncaughtException.");
    console.log(e.message);
    console.error();
    process.exit(1);
});
new ChildExpress().run();
