// 一个辅助函数, 解决模块内部无法使用import的问题
export function requireModule (modulePath: string): any {
    // requireMap[modulePath] = require(modulePath);
    return require(modulePath);
}