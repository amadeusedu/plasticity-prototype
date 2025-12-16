declare const describe: (name: string, fn: () => void | Promise<void>) => void;
declare const it: typeof describe;
declare const test: typeof describe;
declare const expect: any;
declare const beforeEach: typeof describe;
declare const afterEach: typeof describe;
declare const beforeAll: typeof describe;
declare const afterAll: typeof describe;

declare const vi: {
  fn: (...args: any[]) => any;
  spyOn: (...args: any[]) => any;
  mock: (...args: any[]) => any;
  restoreAllMocks: () => void;
};
