"use server";

import { getServerActions } from "rdb/server";

export async function rdbActionBridge(
  namespace: string,
  action: string,
  args: any,
) {
  const allActions = await getServerActions();
  const ns = (allActions as any)[namespace];

  if (!ns || typeof ns[action] !== "function") {
    throw new Error(`Action ${namespace}.${action} not found`);
  }

  return await ns[action](args);
}
