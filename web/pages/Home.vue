<script setup lang="ts">
import { useRouter } from "vue-router";

const tools = useRouter().getRoutes().filter((r) => r.meta.description);
</script>

<template>
  <main>
    <h1>NE Tools</h1>
    <p class="sub">Kumpulan tool jaringan untuk Cisco Packet Tracer.</p>

    <ul class="tools">
      <li v-for="tool in tools" :key="tool.path">
        <RouterLink class="tool" :to="tool.path">
          <span class="name">{{ tool.meta.title }}</span>
          <span class="desc">{{ tool.meta.description }}</span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
