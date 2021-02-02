"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const Define_1 = require("./lib/Define");
const underscore_1 = require("underscore");
class RpcServer {
    constructor() {
        this.rpcModuleMap = {};
        this.scanFiles = [];
        this.childPro = null;
        this.fileNamePrefix = 'Remote';
        this.protocol = Define_1.ProtocolTypes.http;
        this.httpPort = 10008;
        this.wsPort = 10009;
        this.getAllRpcMethodRoute = 'RpcServer/GetAllRpcMethod';
        this.maxTryTimes = 3;
        this.haveTryTimes = 0;
    }
    static getInstance() {
        if (!RpcServer.instance) {
            RpcServer.instance = new RpcServer();
        }
        return RpcServer.instance;
    }
    prefix(prefix) {
        if (underscore_1.isUndefined(prefix)) {
            return this.fileNamePrefix;
        }
        else {
            this.fileNamePrefix = String(prefix);
            return this;
        }
    }
    serverType(type) {
        if (underscore_1.isUndefined(type)) {
            return this.protocol;
        }
        if (!Define_1.ProtocolTypes[type]) {
            throw new Error(`Server: type=${type}, type must be element in ${Define_1.ProtocolTypes}`);
        }
        this.protocol = type;
        return this;
    }
    port(port) {
        if (underscore_1.isUndefined(port)) {
            return this.protocol == Define_1.ProtocolTypes.http ? this.httpPort : this.wsPort;
        }
        if (isNaN(port) || port > 65535 || port < 1024)
            throw new Error('Server: port must be valid number(1024 - 65535)');
        if (this.protocol == Define_1.ProtocolTypes.http) {
            this.httpPort = port;
        }
        if (this.protocol == Define_1.ProtocolTypes.webSocket) {
            this.wsPort = port;
        }
        return this;
    }
    rpcMethodRoute(route) {
        if (underscore_1.isUndefined(route)) {
            return this.getAllRpcMethodRoute;
        }
        else {
            this.getAllRpcMethodRoute = String(route);
            return this.getAllRpcMethodRoute;
        }
    }
    times(times) {
        if (underscore_1.isUndefined(times)) {
            return this.maxTryTimes;
        }
        else {
            this.maxTryTimes = Number(times);
            if (isNaN(this.maxTryTimes))
                throw new Error('Server: tryTimes must be valid number');
            return this.maxTryTimes;
        }
    }
    initRpcServer(folder) {
        if (!folder) {
            throw new Error('not specified folder, please specify a basic rpc scan floder');
        }
        folder = path.resolve(folder);
        if (/^\.+/.test(folder)) {
            throw new Error('please provide absolute path like \\alida\\remote or D:\\remote or /remote ');
        }
        const stats = fs.statSync(folder);
        if (!stats.isDirectory()) {
            throw new Error(`initRpcServer: ${folder} is not a valid folder.`);
        }
        this.scanRpcFolder(folder);
        this.generateRpcMethodMap();
        this.startChildProcess();
        return this;
    }
    scanRpcFolder(folder) {
        const files = fs.readdirSync(folder);
        for (let file of files) {
            const filePath = path.resolve(folder, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && /\.(js)|(jsx)/.test(path.extname(file)) && file.substr(0, this.fileNamePrefix.length) === this.fileNamePrefix) {
                this.scanFiles.push(filePath);
            }
        }
    }
    generateRpcMethodMap() {
        if (this.scanFiles.length === 0) {
            console.warn('RpcServer: there is no any rpc file provide');
        }
        for (let filePath of this.scanFiles) {
            const modName = path.basename(filePath).replace(/\.(js)|(jsx)$/, '').substr(this.fileNamePrefix.length);
            if (modName === '') {
                throw new Error(`generateRpcMethodMap: ${filePath} is not a valid rpc file.`);
            }
            let modObj = require(filePath);
            if (!modObj) {
                console.warn(`RpcServer: require ${filePath}, but can not find ${filePath} when require. `);
                continue;
            }
            this.rpcModuleMap[modName] = { filePath: filePath, methodList: [] };
            const names = Object.getOwnPropertyNames(modObj.constructor.prototype);
            for (let methodName of names) {
                if (typeof modObj[methodName] === 'function' && methodName !== 'constructor') {
                    this.rpcModuleMap[modName].methodList.push(methodName);
                }
            }
        }
    }
    startChildProcess() {
        this.childPro = childProcess.fork(path.resolve(__dirname, './Child.js'));
        this.childPro.send({ type: 'start', data: {
                rpcModuleMap: this.rpcModuleMap,
                route: this.getAllRpcMethodRoute,
                protocol: this.protocol,
                port: this.protocol == Define_1.ProtocolTypes.http ? this.httpPort : this.wsPort
            } });
        this.childPro.on('message', this.onMessage.bind(this));
        this.childPro.on('error', this.onExit.bind(this));
        this.childPro.on('exit', this.onExit.bind(this));
    }
    onMessage(message) {
        console.log('收到子进程消息:', message);
        if (message.type === 'start') {
            console.log('子进程 rpc服务器启动成功');
        }
    }
    onExit(info, signal) {
        console.log('子进程退出:', info, signal);
        if (signal) {
            console.log(`子进程收到信号 ${signal} 退出`);
            return;
        }
        if (++this.haveTryTimes < this.maxTryTimes) {
            this.startChildProcess();
        }
        else {
            console.error(`Server: 子进程已达最大重启次数, 仍未正常启动`);
        }
    }
    close() {
        this.childPro && this.childPro.kill();
    }
}
exports.RpcServer = RpcServer;
RpcServer.instance = null;
//# sourceMappingURL=RpcServer.js.map