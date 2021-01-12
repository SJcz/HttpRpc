import { IModuleIntroduce, IPromiseReturn } from './lib/Define';
import { promiseRequest } from './lib/Util';
import { ClientProxy } from './proxy';

export class RpcClient {
    private rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    private static instance: RpcClient | null = null;
    /**是否跟服务器连接成功, 仅在成功获取rpc方法列表才算连接成功 */
    private connected = false;
    private rpcServerUrl = '';
    public rpc: RpcModule = {};

    static getInstance(): RpcClient {
        if (!RpcClient.instance) {
            RpcClient.instance = new RpcClient();
        }
        return RpcClient.instance;
    }

    initClient (url: string, basicRoute?: string): Promise<RpcClient> {
        const self = this;
        this.rpc = {};
        basicRoute = basicRoute || '/RpcServer/GetAllRpcMethod';
        if (!url) {
            throw new Error('RpcClient: You must provide a rpc server url!!!');
        }
        this.rpcServerUrl = url;
        return promiseRequest({
            url: this.rpcServerUrl + basicRoute,
            method: 'POST'
        }).then((result: IPromiseReturn) => {
            if (result.statusCode !== 200) {
                console.error(`RpcClient: Can not get correct respose from RpcServer: ${self.rpcServerUrl} when reqeust module-method-list`); 
            } else {
                self.rpcModuleMap = result.data;
                self.initProxy();
                self.connected = true;
                console.log(`RpcClient: Get rpc module-method-list success: ${JSON.stringify(result.data)}`);
            }
            return self;
        }).catch(this.errorHandler);
    }

    initProxy(): RpcClient {
        for (let mod in this.rpcModuleMap) {
            for (let method of this.rpcModuleMap[mod].methodList) {
                ClientProxy.genProxy(this, mod, method);
            }
        }
        return this;
    }

    rpcFunction (moduleName: string, method: string, ...params: any): Promise<IPromiseReturn> {
        if(!this.connected) {
            throw new Error('RpcClient: RpcClient is not connected.');
        }
        if (!this.rpcModuleMap[moduleName]) {
            throw new Error(`RpcClient: RpcServer not provide module: ${moduleName}, please comfrim RpcClient initialize success or RpcServer own this module`);
        }
        if (Object.prototype.toString.call(this.rpcModuleMap[moduleName].methodList) !== '[object Array]') {
            throw new Error(`RpcClient: methodList of module ${moduleName} by RpcServer is not an array!!!`);
        }
        if (this.rpcModuleMap[moduleName].methodList.indexOf(method) === -1) {
            throw new Error(`RpcClient: module ${moduleName} no such function: ${method}`);
        }
        return promiseRequest({
            url: `${this.rpcServerUrl}/${moduleName}/${method}`,
            method: 'POST',
            json: true,
            headers: {
                'content-type': 'application/json',
            },
            body: params
        });
    }

    private errorHandler (e: Error): RpcClient {
        this.connected = false;
        console.warn('RpcClient: initialize RpcClient rpcModuleMap failed.');
        console.error(e.stack);
        return this;
    }
}
