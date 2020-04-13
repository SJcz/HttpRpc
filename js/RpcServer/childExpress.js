"use strict";
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
var Util_1 = require("./lib/Util");
/**不是期待的数据类型 */
var UNEXPTECED_TYPE = 'Unexpected Type';
/**http服务器 端口 */
var EXPRESS_PORT = 10008;
/**子进程返回给主进程启动成功 */
var SERVER_SUCCESS = 'SUCCESS';
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
        if (!this.app) {
            throw new Error('RpcServer: when adding route , find app is not initialized');
        }
        if (Object.prototype.toString.call(moduleIntroduce.methodList) !== '[object Array]') {
            console.warn("RpcServer: methodList of module " + moduleName + " is not a array. please provide a valid array!");
            return;
        }
        // 由于这里无法使用import(namespace和module内部无法使用import), 所以在外面使用import之后再返回回来
        var modObj = Util_1.requireModule(moduleIntroduce.filePath);
        var mod = modObj[moduleName];
        if (!mod) {
            console.warn("RpcServer: require " + moduleIntroduce.filePath + ", but can not find " + moduleIntroduce.filePath + " when require. ");
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var self = this;
        var _loop_1 = function (method) {
            console.log("RpcServer: add route | " + moduleName + "/" + method + " | success");
            // 使用这种写法是因为由于路由回调处理函数始终需要使用moduleName 和method这两个变量
            // 导致addRoute函数执行完毕之后该函数里面所有产生的变量并不会回收(闭包导致)
            //  使用立即执行函数将这两个变量放入另一个函数内部， addRoute函数执行完毕
            // 内部所有变量全部被回收
            (function (parentRoute, subRoute) {
                self.app.post("/" + parentRoute + "/" + subRoute, function (req, res) {
                    var _a;
                    //这里需要将body里面参数提取出来，然后依次作为需要运行的方法的参数
                    //使用拓展运算符
                    var arguement = _.values(req.body);
                    var result = (_a = mod[method]).call.apply(_a, __spreadArrays([null], arguement));
                    console.log("get " + parentRoute + "/" + subRoute + " return value=" + JSON.stringify(result));
                    res.json(result);
                });
            })(moduleName, method);
        };
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
        console.log('收到父进程消息', msgObj);
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
