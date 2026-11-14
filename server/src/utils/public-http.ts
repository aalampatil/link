import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";

type Address = { address: string; family: number };
type Lookup = (hostname: string) => Promise<Address[]>;
type ProbeResponse = { status: number; location?: string };
type RequestProbe = (
  url: URL,
  address: Address,
  method: "HEAD" | "GET",
  signal: AbortSignal,
) => Promise<ProbeResponse>;
export type HealthResult = {
  url: string;
  status: "healthy" | "unavailable" | "restricted" | "unsupported";
  statusCode: number | null;
};
const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(network, prefix, "ipv4");
blocked.addAddress("168.63.129.16");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [network, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
] as const)
  blocked.addSubnet(network, prefix, "ipv6");

export function isPublicAddress(address: string) {
  const family = isIP(address);
  return family === 4
    ? !blocked.check(address, "ipv4")
    : family === 6 &&
        globalV6.check(address, "ipv6") &&
        !blocked.check(address, "ipv6");
}
class UnsafeTargetError extends Error {}

async function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let onAbort: () => void;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    return await Promise.race([promise, aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort!);
  }
}

export async function resolvePublicTarget(
  raw: string,
  resolve: Lookup = (hostname) => lookup(hostname, { all: true }),
  signal = AbortSignal.timeout(8000),
) {
  signal.throwIfAborted();
  const url = new URL(raw);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port)) ||
    /(^|\.)(localhost|local|internal)$/.test(hostname)
  )
    throw new UnsafeTargetError("Unsupported check target");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await abortable(resolve(hostname), signal);
  if (
    !addresses.length ||
    addresses.some((address) => !isPublicAddress(address.address))
  )
    throw new UnsafeTargetError("Unsupported check target");
  return { url, address: addresses[0]! };
}

const requestProbe: RequestProbe = (url, address, method, signal) =>
  new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? https : http).request(
      url,
      {
        method,
        signal,
        agent: false,
        family: address.family,
        lookup: (_hostname, _options, callback) =>
          callback(null, address.address, address.family),
        headers: {
          "User-Agent": "Link-Destination-Check/1.0",
          ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
        },
      },
      (response) => {
        const result: ProbeResponse = { status: response.statusCode ?? 0 };
        if (response.headers.location)
          result.location = response.headers.location;
        response.destroy();
        resolve(result);
      },
    );
    request.on("error", reject);
    request.end();
  });

export async function probeUrl(
  raw: string,
  options: {
    signal?: AbortSignal;
    lookup?: Lookup;
    request?: RequestProbe;
  } = {},
): Promise<HealthResult> {
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(8000)])
    : AbortSignal.timeout(8000);
  try {
    let current = raw;
    for (let redirects = 0; redirects <= 3; redirects++) {
      // Resolve and pin a public IP for every hop; the request never re-resolves DNS.
      const target = await resolvePublicTarget(current, options.lookup, signal);
      const perform = options.request ?? requestProbe;
      let response = await perform(target.url, target.address, "HEAD", signal);
      if ([405, 501].includes(response.status))
        response = await perform(target.url, target.address, "GET", signal);
      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.location
      ) {
        current = new URL(response.location, target.url).toString();
        continue;
      }
      return {
        url: raw,
        status:
          response.status >= 200 && response.status < 400
            ? "healthy"
            : [404, 410].includes(response.status) ||
                response.status >= 500 ||
                !response.status
              ? "unavailable"
              : "restricted",
        statusCode: response.status || null,
      };
    }
    return { url: raw, status: "unavailable", statusCode: null };
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason;
    return {
      url: raw,
      status:
        error instanceof UnsafeTargetError ? "unsupported" : "unavailable",
      statusCode: null,
    };
  }
}
