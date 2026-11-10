import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { convert, InputError, referenceTable } from "./netmask";

const api = new Elysia({ prefix: "/api" })
  .error({ InputError })
  .onError(({ code, error, status }) => {
    if (code === "InputError") return status(400, { error: error.message });
  })
  .get("/netmask2wildcard", ({ query }) => convert(query.mask, query.ip), {
    query: t.Object({ mask: t.String(), ip: t.Optional(t.String()) }),
  })
  .get("/netmask2wildcard/reference", () => referenceTable())
  .get("/*",({ status }) => status(404, { error: "Endpoint tidak ditemukan." }));

const app = new Elysia().use(api);

// In dev, Vite serves the frontend and proxies /api here, so dist/ only exists after a build.
// alwaysStatic registers only the built files, leaving /* free for the Vue Router fallback.
if (await Bun.file("dist/index.html").exists()) {
  app
    .use(await staticPlugin({ assets: "dist", prefix: "/", alwaysStatic: true }))
    .get("/*", () => Bun.file("dist/index.html"));
}

app.listen(Number(process.env.PORT ?? 3000));

console.log(`Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
