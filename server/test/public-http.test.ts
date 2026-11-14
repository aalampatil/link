import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublicAddress, probeUrl, resolvePublicTarget } from "../src/utils/public-http.js";

test("health probes reject private, local, multicast, documentation, and mapped IPv6 addresses", () => {
  for (const address of ["127.0.0.1", "10.1.1.1", "100.64.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "198.18.0.1", "203.0.113.1", "224.0.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::1", "2002:7f00:1::", "garbage"]) assert.equal(isPublicAddress(address), false, address);
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(isPublicAddress(address), true, address);
});
test("health probes reject credentials, nonstandard ports, and mixed public/private DNS answers", async () => {
  for (const url of ["https://user:password@example.com", "http://example.com:8080", "file:///etc/passwd", "http://localhost"]) await assert.rejects(resolvePublicTarget(url));
  await assert.rejects(resolvePublicTarget("https://example.com", async () => [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 }]));
});
test("redirects revalidate their destination before making another request", async () => {
  let requests = 0;
  const result = await probeUrl("https://example.com", { lookup: async () => [{ address: "8.8.8.8", family: 4 }], request: async (_url, address) => { requests++; assert.equal(address.address, "8.8.8.8"); return { status: 302, location: "http://127.0.0.1/private" }; } });
  assert.equal(result.status, "unsupported"); assert.equal(requests, 1);
});
test("HEAD fallback uses a bounded GET and sign-in restrictions are not broken links", async () => {
  const methods: string[] = [];
  const result = await probeUrl("https://8.8.8.8", { request: async (_url, _address, method) => { methods.push(method); return { status: method === "HEAD" ? 405 : 200 }; } });
  assert.deepEqual(methods, ["HEAD", "GET"]); assert.equal(result.status, "healthy");
  assert.equal((await probeUrl("https://8.8.8.8", { request: async () => ({ status: 403 }) })).status, "restricted");
});
test("health probes respect cancellation", async () => {
  await assert.rejects(probeUrl("https://8.8.8.8", { signal: AbortSignal.abort(new Error("Stopped")), request: async () => ({ status: 200 }) }));
});
