import type { Config } from '@react-router/dev/config'

// Situs statis: tanpa server runtime (ssr: false), setiap route di-prerender
// menjadi HTML saat build agar konten langsung terbaca mesin pencari.
export default {
  appDirectory: 'app',
  ssr: false,
  prerender: ['/'],
  // Proyek baru: langsung pakai perilaku React Router v8 agar upgrade nanti mulus.
  future: {
    v8_middleware: true,
    v8_passThroughRequests: true,
    v8_splitRouteModules: true,
    v8_trailingSlashAwareDataRequests: true,
    v8_viteEnvironmentApi: true,
  },
} satisfies Config
