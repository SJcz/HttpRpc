/* eslint-disable @typescript-eslint/interface-name-prefix */
export interface IModuleIntroduce {
    /**文件绝对路径 */
    filePath: string;
    /**模块静态方法列表 */
    methodList: Array<string>;
}

export interface IPromiseReturn {
    /**处理promise的返回状态码 1位成功 -1为失败*/
    statusCode: number;
    /**当处理promise失败时才会存在, 失败信息 */
    msg?: string;
    /**处理成功时的返回数据 */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
}