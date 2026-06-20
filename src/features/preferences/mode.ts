"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type AppMode = "commerce" | "build";

const COOKIE = "sbx_mode";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getMode(): Promise<AppMode> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "build" ? "build" : "commerce";
}

export async function setMode(next: AppMode) {
  const store = await cookies();
  store.set(COOKIE, next, { httpOnly: false, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
  revalidatePath("/", "layout");
}

export async function toggleMode() {
  const current = await getMode();
  await setMode(current === "commerce" ? "build" : "commerce");
}
