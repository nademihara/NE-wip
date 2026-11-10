<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

type Result = {
  prefix: number;
  mask: string;
  wildcard: string;
  hosts: number;
  network: string | null;
  warning: string | null;
  commands: string[];
};
type Row = { prefix: number; mask: string; wildcard: string };

const mask = ref("");
const ip = ref("");
const result = ref<Result | null>(null);
const error = ref("");
const reference = ref<Row[]>([]);
const referenceError = ref("");
const copied = ref<{ index: number; label: string } | null>(null);
let pending: AbortController | null = null;

watch([mask, ip], async ([m, i]) => {
  pending?.abort();
  error.value = "";
  if (!m.trim()) {
    result.value = null;
    return;
  }

  pending = new AbortController();
  try {
    const res = await fetch(`/api/netmask2wildcard?${new URLSearchParams({ mask: m, ip: i })}`, {
      signal: pending.signal,
    });
    const body = await res.json();
    if (res.ok) {
      result.value = body;
    } else {
      result.value = null;
      error.value = body.error ?? "Input tidak valid.";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    result.value = null;
    error.value = "Server tidak bisa dihubungi.";
  }
});

onMounted(async () => {
  try {
    reference.value = await (await fetch("/api/netmask2wildcard/reference")).json();
  } catch {
    referenceError.value = "Tabel referensi gagal dimuat.";
  }
});

async function copy(index: number, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = { index, label: "Tersalin" };
  } catch {
    copied.value = { index, label: "Gagal menyalin" };
  }
  setTimeout(() => (copied.value = null), 1200);
}
</script>

<template>
  <main>
    <RouterLink class="back" to="/">← Semua tools</RouterLink>
    <h1>Subnet Mask → Wildcard Mask</h1>
    <p class="sub">Untuk ACL dan routing (OSPF, EIGRP) di Cisco Packet Tracer.</p>

    <div class="card">
      <label for="mask">Subnet mask <span class="hint">contoh: 255.255.255.0, /24, atau 24</span></label>
      <input id="mask" v-model="mask" autocomplete="off" placeholder="255.255.255.0" autofocus>

      <label for="ip">Alamat network <span class="hint">opsional, untuk membuat perintah Cisco</span></label>
      <input id="ip" v-model="ip" autocomplete="off" placeholder="192.168.1.0">

      <p class="error" aria-live="polite">{{ error }}</p>
    </div>

    <template v-if="result">
      <div class="card">
        <table>
          <tbody>
            <tr><th>Subnet mask</th><td>{{ result.mask }}</td></tr>
            <tr><th>Prefix</th><td>/{{ result.prefix }}</td></tr>
            <tr><th>Wildcard mask</th><td class="big">{{ result.wildcard }}</td></tr>
            <tr><th>Jumlah host</th><td>{{ result.hosts.toLocaleString("id-ID") }}</td></tr>
          </tbody>
        </table>
      </div>

      <div v-if="result.commands.length" class="card">
        <h2>Perintah Cisco</h2>
        <div v-for="(cmd, i) in result.commands" :key="cmd" class="cmd">
          <pre>{{ cmd }}</pre>
          <button type="button" @click="copy(i, cmd)">
            {{ copied?.index === i ? copied.label : "Salin" }}
          </button>
        </div>
        <p v-if="result.warning" class="warn">{{ result.warning }}</p>
      </div>
    </template>

    <div class="card">
      <h2>Tabel referensi <span class="hint">klik baris untuk memakai</span></h2>
      <p v-if="referenceError" class="error">{{ referenceError }}</p>
      <p v-else-if="!reference.length" class="hint">Memuat tabel…</p>
      <div v-else class="scroll">
        <table class="ref">
          <thead><tr><th>Prefix</th><th>Subnet mask</th><th>Wildcard</th></tr></thead>
          <tbody>
            <tr v-for="row in reference" :key="row.prefix" @click="mask = row.mask">
              <td><button type="button">/{{ row.prefix }}</button></td>
              <td>{{ row.mask }}</td>
              <td>{{ row.wildcard }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
