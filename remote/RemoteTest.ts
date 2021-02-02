declare global {
    interface RpcModule {
        Test?: RemoterClass<Test>
    }
}

class Test {
    addNumber (a: number, b: number): number {
        return a + b;
    }

    addString (a: string, b: string): string {
        return a + b;
    }

    addJson (json): any {
        return json;
    }
}

export = new Test();