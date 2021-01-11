declare global {
    interface RpcModule {
        Test?: RemoterClass<Test>;
    }
}

class Test {
    add (a: number, b: number): number {
        return a + b;
    }
}

export = new Test();