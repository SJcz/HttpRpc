"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var childProcess = require("child_process");
var underscore_1 = require("underscore");
var RpcServer = /** @class */ (function () {
    function RpcServer() {
        this.rpcModuleMap = {};
        this.scanFiles = [];
        /**启动的http服务器子进程 */
        this.childPro = null;
        /**要扫描的rpc文件的指定文件名前缀 */
        this.fileNamePrefix = 'Remote';
        /**http服务器 端口 */
        this.port = 10008;
        /**RPC客户端调用服务端所有rpc模块和方法的路由 */
        this.getAllRpcMethodRoute = '/RpcServer/GetAllRpcMethod';
        /**子进程错误导致异常退出时最大重启次数 */
        this.maxTryTimes = 3;
        /**已重启次数 */
        this.haveTryTimes = 0;
    }
    RpcServer.getInstance = function () {
        if (!RpcServer.instance) {
            RpcServer.instance = new RpcServer();
        }
        return RpcServer.instance;
    };
    /**设置或者获取指定文件前缀 */
    RpcServer.prototype.prefix = function (prefix) {
        if (underscore_1.isUndefined(prefix)) {
            return this.fileNamePrefix;
        }
        else {
            this.fileNamePrefix = String(prefix);
            return this.fileNamePrefix;
        }
    };
    /**设置或者获取http服务器端口 */
    RpcServer.prototype.httpPort = function (port) {
        if (underscore_1.isUndefined(port)) {
            return this.port;
        }
        else {
            this.port = Number(port);
            if (isNaN(this.port))
                throw new Error('Server: port must be valid number');
            return this.port;
        }
    };
    /**设置或者获取 RPC客户端调用服务端所有rpc方法的路由  */
    RpcServer.prototype.rpcMethodRoute = function (route) {
        if (underscore_1.isUndefined(route)) {
            return this.getAllRpcMethodRoute;
        }
        else {
            this.getAllRpcMethodRoute = String(route);
            return this.getAllRpcMethodRoute;
        }
    };
    /**设置或者获取 子进程错误导致异常退出时尝试重启次数 */
    RpcServer.prototype.times = function (times) {
        if (underscore_1.isUndefined(times)) {
            return this.maxTryTimes;
        }
        else {
            this.maxTryTimes = Number(times);
            if (isNaN(this.maxTryTimes))
                throw new Error('Server: tryTimes must be valid number');
            return this.maxTryTimes;
        }
    };
    /**
     * 传入的路径应该是一个绝对路径
     * @param folder please provide absolute path
     */
    RpcServer.prototype.initRpcServer = function (folder) {
        if (!folder) {
            throw new Error('not specified folder, please specify a basic rpc scan floder');
        }
        if (/^\.+/.test(folder)) {
            throw new Error('please provide absolute path like \\alida\\remote or D:\\remote or /remote ');
        }
        var stats = fs.statSync(folder);
        if (!stats.isDirectory()) {
            throw new Error("initRpcServer: " + folder + " is not a valid folder.");
        }
        this.scanRpcFolder(folder);
        this.generateRpcMethodMap();
        this.startChildProcess();
    };
    /**
     * 扫描指定文件夹下的指定名字和后缀的文件, .js .jsx
     * @param folder
     */
    RpcServer.prototype.scanRpcFolder = function (folder) {
        var files = fs.readdirSync(folder);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var filePath = path.resolve(folder, file);
            var stats = fs.statSync(filePath);
            if (stats.isFile() && /\.(js)|(jsx)/.test(path.extname(file)) && file.substr(0, this.fileNamePrefix.length) === this.fileNamePrefix) {
                this.scanFiles.push(filePath);
            }
        }
    };
    /**
     * 根据扫描的结果文件，生成rpc模块和方法列表的map对象
     */
    RpcServer.prototype.generateRpcMethodMap = function () {
        if (this.scanFiles.length === 0) {
            console.warn('RpcServer: there is no any rpc file provide');
        }
        for (var _i = 0, _a = this.scanFiles; _i < _a.length; _i++) {
            var filePath = _a[_i];
            var modName = path.basename(filePath).replace(/\.(js)|(jsx)$/, '').substr(this.fileNamePrefix.length);
            if (modName === '') {
                throw new Error("generateRpcMethodMap: " + filePath + " is not a valid rpc file.");
            }
            var modObj = require(filePath);
            if (!modObj) {
                console.warn("RpcServer: require " + filePath + ", but can not find " + filePath + " when require. ");
                continue;
            }
            this.rpcModuleMap[modName] = { filePath: filePath, methodList: [] };
            // var Test = /** @class */ (function () {
            //     function Test() {
            //     }
            //     Test.add = function (a, b) {
            //         return a + b;
            //     };
            //     return Test;
            // }());
            // exports.Test = Test;
            // 以上就是TS的静态方法编译之后的js形式, 直接挂在在函数对象上
            // -------------------------------------
            // Object.defineProperty(exports, "__esModule", { value: true });
            // var Test = /** @class */ (function () {
            //     function Test() {
            //     }
            //     Test.prototype.add = function (a, b) {
            //         return a + b;
            //     };
            //     return Test;
            // }());
            // exports.Test = Test;
            // 以上就是TS的对象方法编译之后的js形式, 挂在在函数的原型对象上
            // 看编译之后的js文件, 通过for in获取的都是该函数对象的key;
            for (var methodName in modObj) {
                if (typeof modObj[methodName] === 'function') {
                    this.rpcModuleMap[modName].methodList.push(methodName);
                }
            }
        }
    };
    /**
     * 启动子进程, 将rpcModuleMap发送到子进程去生成express路由
     */
    RpcServer.prototype.startChildProcess = function () {
        this.childPro = childProcess.fork(path.resolve(__dirname, './ChildExpress.js'));
        this.childPro.send({ type: 'start', cmd: 'express', data: {
                rpcModuleMap: this.rpcModuleMap,
                port: this.port,
                route: this.getAllRpcMethodRoute
            } });
        this.childPro.on('message', this.onMessage.bind(this));
        this.childPro.on('error', this.onError.bind(this));
        this.childPro.on('exit', this.onExit.bind(this));
    };
    RpcServer.prototype.onMessage = function (message) {
        console.log('收到子进程消息:', message);
    };
    RpcServer.prototype.onError = function (err) {
        console.log('子进程错误:', err);
        if (this.childPro && this.childPro.kill) {
            this.childPro.kill();
        }
        if (++this.haveTryTimes < this.maxTryTimes) {
            this.startChildProcess();
        }
        else {
            console.error("Server: \u5B50\u8FDB\u7A0B\u5DF2\u8FBE\u6700\u5927\u91CD\u542F\u6B21\u6570, \u4ECD\u672A\u6B63\u5E38\u542F\u52A8");
        }
    };
    RpcServer.prototype.onExit = function (code) {
        console.log('子进程退出:', code);
        if (this.childPro && this.childPro.kill) {
            this.childPro.kill();
        }
        if (++this.haveTryTimes < this.maxTryTimes) {
            this.startChildProcess();
        }
        else {
            console.error("Server: \u5B50\u8FDB\u7A0B\u5DF2\u8FBE\u6700\u5927\u91CD\u542F\u6B21\u6570, \u4ECD\u672A\u6B63\u5E38\u542F\u52A8");
        }
    };
    RpcServer.instance = null;
    return RpcServer;
}());
exports.RpcServer = RpcServer;
