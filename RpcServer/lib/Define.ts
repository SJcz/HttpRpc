/* eslint-disable @typescript-eslint/interface-name-prefix */
export interface IModuleIntroduce {
    /**文件绝对路径 */
    filePath: string;
    /**模块静态方法列表 */
    methodList: Array<string>;
}

export interface IProcessMsg<T> {
    type: string;
    data: T
}

export interface IProcessStartMsg {
    rpcModuleMap: {
        [key: string]: IModuleIntroduce
    };
    port?: number; 
    protocol?: ProtocolTypes;
    route?: string;
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
}

export interface ISocketResponseMsg {
    data?: any;
    reqId: number;
    statusCode: number;
}