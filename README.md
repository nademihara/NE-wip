# NE-wip

Kumpulan tool jaringan untuk Cisco Packet Tracer. Backend Elysia, frontend Vue, runtime Bun.

## Menjalankan

```bash
bun install
bun run dev        # Elysia di :3000 + Vite di http://localhost:5173
```

Produksi:

```bash
bun run build      # build frontend ke dist/
bun run start      # Elysia serve API + dist/ di http://localhost:3000
```

Tes: `bun test`

## Struktur

- `src/index.ts`: server Elysia, route `/api/*` dan serve `dist/`
- `src/netmask.ts`: logika konversi subnet mask ke wildcard mask
- `web/`: frontend Vue. Daftar route ada di `main.ts`; tool baru yang punya `meta.title` dan `meta.description` otomatis muncul di halaman depan.

## API

- `GET /api/netmask2wildcard?mask=255.255.255.0&ip=192.168.1.0`
- `GET /api/netmask2wildcard/reference`
