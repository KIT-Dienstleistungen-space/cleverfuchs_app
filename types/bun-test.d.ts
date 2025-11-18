declare module "bun:test" {
  export const describe: (...args: any[]) => void;
  export const test: (...args: any[]) => void;
  export const expect: any;
  export const mock: <T extends (...args: any[]) => any>(fn: T) => T & {
    mock: { calls: any[] };
  };
}
