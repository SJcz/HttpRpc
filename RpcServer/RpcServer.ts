import path = require('path');
import fs = require('fs');
import childProcess = require('child_process');
import { IModuleIntroduce, IProcessMsg, ProtocolTypes } from './lib/Define';
import { isUndefined } from 'underscore';

export class RpcServer {
    public rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    public scanFiles: Array<string> = [];
    private static instance: RpcServer | null = null;
    /**启动的http服务器子进程 */
    private childPro: childProcess.ChildProcess | null = null;
    /**要扫描的rpc文件的指定文件名前缀 */
    private fileNamePrefix = 'Remote';
    /**底层使用的协议类型 */
    private protocol = ProtocolTypes.http;
    /**http服务器 端口 */
    private httpPort = 10008;
    /**websocket服务器 端口 */
    private wsPort = 10009;
    /**RPC客户端调用服务端所有rpc模块和方法的路由 */
    private getAllRpcMethodRoute = 'RpcServer/GetAllRpcMethod';
    /**子进程错误导致异常退出时最大重启次数 */
    private maxTryTimes = 3;
    /**已重启次数 */
    private haveTryTimes = 0;

    static getInstance(): RpcServer {
        if (!RpcServer.instance) {
            RpcServer.instance = new RpcServer();
        }
        return RpcServer.instance;
    }

    /**设置或者获取指定文件前缀 */
    prefix(prefix?: string): string | RpcServer {
        if (isUndefined(prefix)) {
            return this.fileNamePrefix;
        } else {
            this.fileNamePrefix = String(prefix);
            return this;
        }
    }

    /**设置或者获取底层的服务器类型 */
    serverType(type?: ProtocolTypes): ProtocolTypes | RpcServer {
        if (isUndefined(type)) {
            return this.protocol;
        } 
        if (!ProtocolTypes[type]) {
            throw new Error(`Server: type=${type}, type must be element in ${ProtocolTypes}`);
        }
        this.protocol = type;
        return this;
    } 

    /**设置或者获取服务器端口 */
    port(port?: number): number | RpcServer {
        if (isUndefined(port)) {
            return this.protocol == ProtocolTypes.http ? this.httpPort : this.wsPort;
        }
        if (isNaN(port) || port > 65535 || port < 1024) throw new Error('Server: port must be valid number(1024 - 65535)');
        if (this.protocol == ProtocolTypes.http) {
            this.httpPort = port;
        } 
        if (this.protocol == ProtocolTypes.webSocket) {
            this.wsPort = port;
        } 
        return this;
    }

    /**设置或者获取 RPC客户端调用服务端所有rpc方法的路由  */
    rpcMethodRoute(route?: string): string {
        if (isUndefined(route)) {
            return this.getAllRpcMethodRoute;
        } else {
            this.getAllRpcMethodRoute = String(route);
            return this.getAllRpcMethodRoute;
        }
    }

    /**设置或者获取 子进程错误导致异常退出时尝试重启次数 */
    times(times?: number): number {
        if (isUndefined(times)) {
            return this.maxTryTimes;
        } else {
            this.maxTryTimes = Number(times);
            if (isNaN(this.maxTryTimes)) throw new Error('Server: tryTimes must be valid number');
            return this.maxTryTimes;
        }
    }

    /**
     * 传入的路径应该是一个绝对路径
     * @param folder
     */
    initRpcServer (folder?: string): RpcServer {
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

    /**
     * 扫描指定文件夹下的指定名字和后缀的文件, .js .jsx
     * @param folder
     */
    scanRpcFolder (folder: string): void {
        const files = fs.readdirSync(folder);
        for (let file of files) {
            const filePath = path.resolve(folder, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && /\.(js)|(jsx)/.test(path.extname(file)) && file.substr(0, this.fileNamePrefix.length) === this.fileNamePrefix) {
                this.scanFiles.push(filePath);
            }
        }
    }

    /**
     * 根据扫描的结果文件，生成rpc模块和方法列表的map对象
     */
    generateRpcMethodMap (): void {
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
            const names = Object.getOwnPropertyNames(modObj.constructor.prototype); // 因为ES6的类的内部函数无法枚举, 使用该方法获取某个对象的原型的所有属性.
            for (let methodName of names) {
                if (typeof modObj[methodName] === 'function' && methodName !== 'constructor') {
                    this.rpcModuleMap[modName].methodList.push(methodName);
                }
            }
        }
    }

    /**
     * 启动子进程, 将rpcModuleMap发送到子进程去生成服务器协议路由
     */
    startChildProcess (): void {
        this.childPro = childProcess.fork(path.resolve(__dirname, './Child.js'));
        this.childPro.send({ type: 'start', data: {
            rpcModuleMap: this.rpcModuleMap, 
            route: this.getAllRpcMethodRoute,
            protocol: this.protocol,
            port: this.protocol == ProtocolTypes.http ? this.httpPort : this.wsPort
        }});
        this.childPro.on('message', this.onMessage.bind(this));
        this.childPro.on('error', this.onExit.bind(this));
        this.childPro.on('exit', this.onExit.bind(this));
    }

    onMessage (message: IProcessMsg<any>): void {
        console.log('收到子进程消息:', message);
        if (message.type === 'start') {
            console.log('子进程 rpc服务器启动成功');
        }
    }

    onExit(info: number | Error, signal: string): void {
        console.log('子进程退出:', info, signal);
        if (signal) {
            console.log(`子进程收到信号 ${signal} 退出`);
            return;
        }
        if (++this.haveTryTimes < this.maxTryTimes) {
            this.startChildProcess();
        } else {
            console.error(`Server: 子进程已达最大重启次数, 仍未正常启动`)
        }
    }

    close() {
        this.childPro && this.childPro.kill();
    }
}
