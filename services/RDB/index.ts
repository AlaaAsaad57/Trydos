import { rdbActionBridge } from "./serverActions";

export const serverActions = new Proxy({} as any, {
  get(_, namespace: string) {
    return new Proxy(
      {},
      {
        get(_, action: string) {
          return (args: any) => rdbActionBridge(namespace, action, args);
        },
      },
    );
  },
});
