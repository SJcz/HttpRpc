import path = require('path');
import fs = require('fs');
import os = require('os');
import childProcess = require('child_process');
import { IModuleIntroduce } from './lib/Define';
import { requireModule } from './lib/Util';

export class RpcServer {
    public rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    public scanFiles: Array<string> = [];
    private static instance: RpcServer | null = null;
    private fileNamePrefix = 'Remote';
    constructor() {
        // 无论是使用 getInstance 还是 new 创建，保证都是同一个对象
        if (!RpcServer.instance) {
            this.rpcModuleMap = {};
            RpcServer.instance = this;
        }
        return RpcServer.instance;
    }

    static getInstance(): RpcServer {
        if (!RpcServer.instance) {
            RpcServer.instance = new RpcServer();
        }
        return RpcServer.instance;
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
            throw new Error('please provide absolute path like \\alida\\pm2 or D:\\inter or /pm2 ');
        }

        const stats = fs.statSync(folder);

        if (!stats.isDirectory()) {
            throw new Error(`initRpcServer: ${folder} is not a valid folder.`);
        }
        this.scanRpcFolder(folder);
        this.generateRpcMethodMap();
        console.log(this.rpcModuleMap);
        this.generateExpressRoute();
    }

    /**
     * 扫描指定文件夹下的指定名字和后缀的文件
     * @param folder
     */
    scanRpcFolder (folder: string): void {
        const files = fs.readdirSync(folder);
        for (let file of files) {
            const filePath = path.resolve(folder, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() &&
                    /\.(js)|(jsx)/.test(path.extname(file)) &&
                    file.substr(0, this.fileNamePrefix.length) === this.fileNamePrefix) {
                this.scanFiles.push(filePath);
            }
        }
    }

    /**
     * 根据扫描的结果文件，生成rpc模块和方法列表的map对象
     */
    generateRpcMethodMap (): void {
        if (this.scanFiles.length === 0) {
            console.warn('there is no any rpc file provide');
        }
        for (let filePath of this.scanFiles) {
            const modName = path.basename(filePath).replace(/\.(js)|(jsx)$/, '').substr(this.fileNamePrefix.length);
            console.log(modName);
            if (modName === '') {
                throw new Error(`generateRpcMethodMap: ${filePath} is not a valid rpc file.`);
            }
            // 由于这里无法使用import(namespace和module内部无法使用import), 所以在外面使用import之后再返回回来
            const modObj = requireModule(filePath);
            const mod = modObj[modName];
            if (!mod) {
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
            // 看编译之后的js文件, 通过for in获取的都是该函数对象的key; 如果rpc方法不是静态方法, 那么只有从函数的prototype中获取方法名.
            for (let methodName in mod) {
                if (typeof mod[methodName] === 'function') {
                    this.rpcModuleMap[modName].methodList.push(methodName);
                }
            }
        }
    }

    /**
     * 根据得到的rpcModuleMap来生成express路由
     */
    generateExpressRoute (): void {
        const cpus = os.cpus();
        console.log(`cpus.length=${cpus.length}`);
        for (let i = 0; i < 1; i++) {
            // eslint-disable-next-line no-undef
            const childPro = childProcess.fork(path.resolve(__dirname, './ChildExpress.js'));
            console.log(childPro.pid);
            childPro.send({type: 'start', rpcModuleMap: this.rpcModuleMap});
            childPro.on('message', this.onMessage.bind(this));
        }
    }

    onMessage (message: string): void {
        console.log('收到子进程消息:', message, typeof message);
    }


    /* 读取文件字符串的内容， 用正则找方法名
    readScanFiles (): void {
        const regExp = new RegExp(/\s*exports\.([a-zA-Z0-9]+)\s*=\s*([a-zA-Z0-9]+)/);
        if (this.scanFiles.length === 0) {
            console.warn('there is no any rpc file provide');
        }
        for (let filePath of this.scanFiles) {
            const contentStr = fs.readFileSync(filePath, 'utf8');
            console.log(contentStr);
            const matchResult = regExp.exec(contentStr);
            if (!matchResult) {
                console.warn('please check your rpc file is contain content like \'exports.xxx = xxx\'');
                continue;
            }
        }
    }
    */
}

//RpcServer.getInstance().initRpcServer(path.resolve(__dirname, '../remote'));
// const rpcServer = RpcServer.getInstance();
// rpcServer.initRpcServer(path.resolve(__dirname, '../remote'));
// console.log(rpcServer.scanFiles);
// console.log(rpcServer.rpcModuleMap);
