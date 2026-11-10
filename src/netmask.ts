export function toDotted(n: number) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}

export function parseIp(str: string) {
  const parts = str.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    n = n * 256 + Number(p);
  }
  return n >>> 0;
}

export function prefixToMask(prefix: number) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

// Returns the prefix length, or null if the input is not a valid contiguous mask.
export function parseMask(str: string) {
  const s = str.trim().replace(/^\//, "");
  if (/^\d{1,2}$/.test(s)) {
    const p = Number(s);
    return p <= 32 ? p : null;
  }
  const n = parseIp(s);
  if (n === null) return null;
  const inverted = ~n >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;
  return 32 - Math.log2(inverted + 1);
}

function aclTarget(net: string, prefix: number, wild: string) {
  if (prefix === 32) return `host ${net}`;
  if (prefix === 0) return "any";
  return `${net} ${wild}`;
}

export class InputError extends Error {}

export function convert(maskStr: string, ipStr = "") {
  const prefix = parseMask(maskStr);
  if (prefix === null) {
    throw new InputError("Subnet mask tidak valid. Bit 1 harus berurutan dari kiri, misalnya 255.255.255.0.");
  }

  const mask = prefixToMask(prefix);
  const wildcard = toDotted(~mask >>> 0);
  const result = {
    prefix,
    mask: toDotted(mask),
    wildcard,
    hosts: prefix >= 31 ? (prefix === 32 ? 1 : 2) : 2 ** (32 - prefix) - 2,
    network: null as string | null,
    warning: null as string | null,
    commands: [] as string[],
  };

  if (!ipStr.trim()) return result;

  const ipN = parseIp(ipStr);
  if (ipN === null) throw new InputError("Alamat network tidak valid.");

  const netN = (ipN & mask) >>> 0;
  const net = toDotted(netN);
  // Cisco ignores host bits under the wildcard, so show the real network address instead.
  if (netN !== ipN) {
    result.warning = `${toDotted(ipN)} bukan alamat network untuk /${prefix}. Perintah memakai ${net}.`;
  }

  const target = aclTarget(net, prefix, wildcard);
  result.network = net;
  result.commands = [
    `access-list 10 permit ${target}`,
    `access-list 100 permit ip ${target} any`,
    `router ospf 1\n network ${net} ${wildcard} area 0`,
    `router eigrp 1\n network ${net} ${wildcard}`,
  ];
  return result;
}

export function referenceTable() {
  const rows = [];
  for (let p = 8; p <= 32; p++) {
    const m = prefixToMask(p);
    rows.push({ prefix: p, mask: toDotted(m), wildcard: toDotted(~m >>> 0) });
  }
  return rows;
}
