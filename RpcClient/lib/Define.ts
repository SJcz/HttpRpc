export interface IModuleIntroduce {
    /**文件绝对路径 */
    filePath: string;
    /**模块静态方法列表 */
    methodList: Array<string>;
}

/**底层协议类型 */
export enum ProtocolTypes {
    http = 1,
    webSocket = 2
}

export interface ISocketRequestMsg {
    route: string;
    body: any;
    reqId: number;
    /**该请求完成后的回调 */
    onSuccess: Function;
    /**该请求失败后的回调 */
    onFail: Function;
}

export interface ISocketResponseMsg {
    data: any;
    reqId: number;
    statusCode: number;
}

declare global {
    interface RpcModule {
        
    }
    type RemoterClass<T> = {
        [P in keyof T]?: RemoterProxyWithPromise;
    };

    interface RemoterProxyWithPromise {
        (...args: any[]): Promise<any>;
    }
}