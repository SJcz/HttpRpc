export interface IModuleIntroduce {
    /**文件绝对路径 */
    filePath: string;
    /**模块静态方法列表 */
    methodList: Array<string>;
}

export interface IPromiseReturn {
    /**处理promise的返回状态码 200为成功 其他失败*/
    statusCode: number;
    /**当处理promise失败时才会存在, 失败信息 */
    msg?: string;
    /**处理成功时的返回数据 */
    data?: any;
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