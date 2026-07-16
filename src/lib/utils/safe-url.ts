// Guards against rendering a stored string as an href/src when it isn't an
// http(s) URL — javascript:/data: URIs are technically "valid URLs" by the
// WHATWG spec, so `new URL(x)` succeeding is not enough on its own.
export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    return /^https?:\/\//i.test(new URL(value).href);
  } catch {
    return false;
  }
}
