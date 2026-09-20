import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { PinGateProvider } from './lib/PinGate'

// PRD v3.0: aplikasi terdiri dari dashboard admin (terlindungi JWT) dan
// halaman tagihan publik bertoken. Tidak ada lagi portal pelanggan berbasis
// login, sehingga halaman landing pemilih portal juga dihapus.
const AdminRoutes = lazy(() => import('./routes/admin'))
const PublicInvoice = lazy(() => import('./routes/invoice/PublicInvoice'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Memuat…
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <PinGateProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Halaman tagihan pelanggan — publik, dibuka dari tautan WhatsApp/email */}
              <Route path="/tagihan/:token" element={<PublicInvoice />} />

              <Route path="/admin/*" element={<AdminRoutes />} />

              {/* Tidak ada halaman publik lain: arahkan ke dashboard admin */}
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PinGateProvider>
    </AuthProvider>
  )
}

export default App
