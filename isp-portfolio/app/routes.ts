import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

// Route baru juga perlu ditambahkan ke `prerender` di react-router.config.ts.
export default [
  layout('routes/site-layout.tsx', [
    index('routes/home.tsx'),
    route('tentang', 'routes/tentang.tsx'),
    route('layanan', 'routes/layanan.tsx'),
    route('coverage', 'routes/coverage.tsx'),
    route('daftar', 'routes/daftar.tsx'),
    route('cek-tagihan', 'routes/cek-tagihan.tsx'),
    route('kontak', 'routes/kontak.tsx'),
    route('faq', 'routes/faq.tsx'),
    route('syarat-ketentuan', 'routes/syarat-ketentuan.tsx'),
    route('kebijakan-privasi', 'routes/kebijakan-privasi.tsx'),
    // Halaman review komponen; sengaja tidak di-prerender.
    route('ui-kit', 'routes/ui-kit.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
] satisfies RouteConfig
