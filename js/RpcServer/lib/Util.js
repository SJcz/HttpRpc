"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 一个辅助函数, 解决模块内部无法使用import的问题
function requireModule(modulePath) {
    // requireMap[modulePath] = require(modulePath);
    return require(modulePath);
}
exports.requireModule = requireModule;
