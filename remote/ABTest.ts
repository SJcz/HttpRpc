declare global {
    interface RpcModule {
        ABTest?: RemoterClass<ABTest>
    }
}

class ABTest {
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

export = new ABTest();