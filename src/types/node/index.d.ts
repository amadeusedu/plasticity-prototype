declare var process: {
  env: Record<string, string | undefined>;
};

declare namespace NodeJS {
  type Timeout = number;
}

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): NodeJS.Timeout;
declare function clearTimeout(handle?: NodeJS.Timeout): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): NodeJS.Timeout;
declare function clearInterval(handle?: NodeJS.Timeout): void;
