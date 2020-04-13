"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var os = require("os");
var childProcess = require("child_process");
var Util_1 = require("./lib/Util");
var RpcServer = /** @class */ (function () {
    function RpcServer() {
        this.rpcModuleMap = {};
        this.scanFiles = [];
        this.fileNamePrefix = 'Remote';
        // 无论是使用 getInstance 还是 new 创建，保证都是同一个对象
        if (!RpcServer.instance) {
            this.rpcModuleMap = {};
            RpcServer.instance = this;
        }
        return RpcServer.instance;
    }
    RpcServer.getInstance = function () {
        if (!RpcServer.instance) {
            RpcServer.instance = new RpcServer();
        }
        return RpcServer.instance;
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
            throw new Error('please provide absolute path like \\alida\\pm2 or D:\\inter or /pm2 ');
        }
        var stats = fs.statSync(folder);
        if (!stats.isDirectory()) {
            throw new Error("initRpcServer: " + folder + " is not a valid folder.");
        }
        this.scanRpcFolder(folder);
        this.generateRpcMethodMap();
        console.log(this.rpcModuleMap);
        this.generateExpressRoute();
    };
    /**
     * 扫描指定文件夹下的指定名字和后缀的文件
     * @param folder
     */
    RpcServer.prototype.scanRpcFolder = function (folder) {
        var files = fs.readdirSync(folder);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var filePath = path.resolve(folder, file);
            var stats = fs.statSync(filePath);
            if (stats.isFile() &&
                /\.(js)|(jsx)/.test(path.extname(file)) &&
                file.substr(0, this.fileNamePrefix.length) === this.fileNamePrefix) {
                this.scanFiles.push(filePath);
            }
        }
    };
    /**
     * 根据扫描的结果文件，生成rpc模块和方法列表的map对象
     */
    RpcServer.prototype.generateRpcMethodMap = function () {
        if (this.scanFiles.length === 0) {
            console.warn('there is no any rpc file provide');
        }
        for (var _i = 0, _a = this.scanFiles; _i < _a.length; _i++) {
            var filePath = _a[_i];
            var modName = path.basename(filePath).replace(/\.(js)|(jsx)$/, '').substr(this.fileNamePrefix.length);
            console.log(modName);
            if (modName === '') {
                throw new Error("generateRpcMethodMap: " + filePath + " is not a valid rpc file.");
            }
            // 由于这里无法使用import(namespace和module内部无法使用import), 所以在外面使用import之后再返回回来
            var modObj = Util_1.requireModule(filePath);
            var mod = modObj[modName];
            if (!mod) {
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
            // 看编译之后的js文件, 通过for in获取的都是该函数对象的key; 如果rpc方法不是静态方法, 那么只有从函数的prototype中获取方法名.
            for (var methodName in mod) {
                if (typeof mod[methodName] === 'function') {
                    this.rpcModuleMap[modName].methodList.push(methodName);
                }
            }
        }
    };
    /**
     * 根据得到的rpcModuleMap来生成express路由
     */
    RpcServer.prototype.generateExpressRoute = function () {
        var cpus = os.cpus();
        console.log("cpus.length=" + cpus.length);
        for (var i = 0; i < 1; i++) {
            // eslint-disable-next-line no-undef
            var childPro = childProcess.fork(path.resolve(__dirname, './ChildExpress.js'));
            console.log(childPro.pid);
            childPro.send({ type: 'start', rpcModuleMap: this.rpcModuleMap });
            childPro.on('message', this.onMessage.bind(this));
        }
    };
    RpcServer.prototype.onMessage = function (message) {
        console.log('收到子进程消息:', message, typeof message);
    };
    RpcServer.instance = null;
    return RpcServer;
}());
exports.RpcServer = RpcServer;
//RpcServer.getInstance().initRpcServer(path.resolve(__dirname, '../remote'));
// const rpcServer = RpcServer.getInstance();
// rpcServer.initRpcServer(path.resolve(__dirname, '../remote'));
// console.log(rpcServer.scanFiles);
// console.log(rpcServer.rpcModuleMap);
