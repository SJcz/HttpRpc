declare global {
    interface RpcModule {
        Test2?: RemoterClass<Test2>
    }
}
class Test2 {
    add2 (a: number, b: number): number {
        return a + b;
    }
}

export = new Test2();