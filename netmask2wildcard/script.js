const $ = (id) => document.getElementById(id);

function toDotted(n) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}

function parseIp(str) {
  const parts = str.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    n = n * 256 + Number(p);
  }
  return n >>> 0;
}

function prefixToMask(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

// Returns the prefix length, or null if the input is not a valid contiguous mask.
function parseMask(str) {
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

function aclTarget(net, prefix, wild) {
  if (prefix === 32) return `host ${net}`;
  if (prefix === 0) return "any";
  return `${net} ${wild}`;
}

function cmdBlock(text) {
  return `<div class="cmd"><pre>${text}</pre><button type="button">Salin</button></div>`;
}

function update() {
  const maskStr = $("mask").value;
  const ipStr = $("ip").value;
  const error = $("error");
  error.textContent = "";

  if (!maskStr.trim()) {
    $("result").classList.add("hidden");
    $("commands").classList.add("hidden");
    return;
  }

  const prefix = parseMask(maskStr);
  if (prefix === null) {
    error.textContent = "Subnet mask tidak valid. Bit 1 harus berurutan dari kiri, misalnya 255.255.255.0.";
    $("result").classList.add("hidden");
    $("commands").classList.add("hidden");
    return;
  }

  const mask = prefixToMask(prefix);
  const wildN = ~mask >>> 0;
  const wild = toDotted(wildN);
  const hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : 2 ** (32 - prefix) - 2;

  $("r-mask").textContent = toDotted(mask);
  $("r-prefix").textContent = "/" + prefix;
  $("r-wild").textContent = wild;
  $("r-hosts").textContent = hosts.toLocaleString("id-ID");
  $("result").classList.remove("hidden");

  const warn = $("host-warn");
  warn.classList.add("hidden");

  if (!ipStr.trim()) {
    $("commands").classList.add("hidden");
    return;
  }

  const ipN = parseIp(ipStr);
  if (ipN === null) {
    error.textContent = "Alamat network tidak valid.";
    $("commands").classList.add("hidden");
    return;
  }

  const netN = (ipN & mask) >>> 0;
  const net = toDotted(netN);
  // Cisco ignores host bits under the wildcard, so show the real network address instead.
  if (netN !== ipN) {
    warn.textContent = `${toDotted(ipN)} bukan alamat network untuk /${prefix}. Perintah memakai ${net}.`;
    warn.classList.remove("hidden");
  }

  const target = aclTarget(net, prefix, wild);
  $("cmd-list").innerHTML = [
    cmdBlock(`access-list 10 permit ${target}`),
    cmdBlock(`access-list 100 permit ip ${target} any`),
    cmdBlock(`router ospf 1\n network ${net} ${wild} area 0`),
    cmdBlock(`router eigrp 1\n network ${net} ${wild}`),
  ].join("");
  $("commands").classList.remove("hidden");
}

$("cmd-list").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  const btn = e.target;
  const text = btn.previousElementSibling.textContent;
  navigator.clipboard.writeText(text).then(
    () => (btn.textContent = "Tersalin"),
    () => (btn.textContent = "Gagal menyalin"),
  ).then(() => setTimeout(() => (btn.textContent = "Salin"), 1200));
});

const ref = $("ref");
for (let p = 8; p <= 32; p++) {
  const m = prefixToMask(p);
  const tr = document.createElement("tr");
  tr.innerHTML = `<td><button type="button">/${p}</button></td><td>${toDotted(m)}</td><td>${toDotted(~m >>> 0)}</td>`;
  tr.addEventListener("click", () => {
    $("mask").value = toDotted(m);
    update();
  });
  ref.appendChild(tr);
}

$("mask").addEventListener("input", update);
$("ip").addEventListener("input", update);
