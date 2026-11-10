import { createApp } from "vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";
import Home from "./pages/Home.vue";
import Netmask2Wildcard from "./pages/Netmask2Wildcard.vue";
import "./style.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home, meta: { title: "NE Tools" } },
    {
      path: "/netmask2wildcard",
      component: Netmask2Wildcard,
      meta: {
        title: "Subnet Mask → Wildcard Mask",
        description: "Ubah subnet mask jadi wildcard mask dan buat perintah ACL, OSPF, dan EIGRP.",
      },
    },
    { path: "/:unknown(.*)", redirect: "/" },
  ],
});

router.afterEach((to) => {
  document.title = String(to.meta.title ?? "NE Tools");
});

createApp(RouterView).use(router).mount("#app");
