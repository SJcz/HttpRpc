import path = require('path');
import fs = require('fs');
import childProcess = require('child_process');
import { IModuleIntroduce, IProcessMsg } from './lib/Define';
import { isUndefined } from 'underscore';

export class RpcServer {
    public rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    public scanFiles: Array<string> = [];
    private static instance: RpcServer | null = null;
    /**启动的http服务器子进程 */
    private childPro: childProcess.ChildProcess | null = null;
    /**要扫描的rpc文件的指定文件名前缀 */
    private fileNamePrefix = 'Remote';
    /**http服务器 端口 */
    private port = 10008;
    /**RPC客户端调用服务端所有rpc模块和方法的路由 */
    private getAllRpcMethodRoute = '/RpcServer/GetAllRpcMethod';
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
    prefix(prefix?: string): string {
        if (isUndefined(prefix)) {
            return this.fileNamePrefix;
        } else {
            this.fileNamePrefix = String(prefix);
            return this.fileNamePrefix;
        }
    }

    /**设置或者获取http服务器端口 */
    httpPort(port?: number): number {
        if (isUndefined(port)) {
            return this.port;
        } else {
            this.port = Number(port);
            if (isNaN(this.port)) throw new Error('Server: port must be valid number');
            return this.port;
        }
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
     * @param folder please provide absolute path
     */
    initRpcServer (folder?: string): void {
        if (!folder) {
            throw new Error('not specified folder, please specify a basic rpc scan floder');
        }
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
            const modObj = require(filePath);
            if (!modObj) {
                console.warn(`RpcServer: require ${filePath}, but can not find ${filePath} when require. `);
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
            for (let methodName in modObj) {
                if (typeof modObj[methodName] === 'function') {
                    this.rpcModuleMap[modName].methodList.push(methodName);
                }
            }
        }
    }

    /**
     * 启动子进程, 将rpcModuleMap发送到子进程去生成express路由
     */
    startChildProcess (): void {
        this.childPro = childProcess.fork(path.resolve(__dirname, './ChildExpress.js'));
        this.childPro.send({ type: 'start', cmd: 'express', data: {
            rpcModuleMap: this.rpcModuleMap, 
            port: this.port, 
            route: this.getAllRpcMethodRoute
        }});
        this.childPro.on('message', this.onMessage.bind(this));
        this.childPro.on('error', this.onError.bind(this));
        this.childPro.on('exit', this.onExit.bind(this));
    }

    onMessage (message: IProcessMsg<any>): void {
        console.log('收到子进程消息:', message);
    }

    onError(err: Error): void {
        console.log('子进程错误:', err);
        if (this.childPro && this.childPro.kill) {
            this.childPro.kill();
        }
        if (++this.haveTryTimes < this.maxTryTimes) {
            this.startChildProcess();
        } else {
            console.error(`Server: 子进程已达最大重启次数, 仍未正常启动`)
        }
    }

    onExit(code: number): void {
        console.log('子进程退出:', code);
        if (this.childPro && this.childPro.kill) {
            this.childPro.kill();
        }
        if (++this.haveTryTimes < this.maxTryTimes) {
            this.startChildProcess();
        } else {
            console.error(`Server: 子进程已达最大重启次数, 仍未正常启动`)
        }
    }
}
