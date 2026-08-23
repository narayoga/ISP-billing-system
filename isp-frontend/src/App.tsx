import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'

const Landing = lazy(() => import('./routes/Landing'))
const CustomerRoutes = lazy(() => import('./routes/customer'))
const AdminRoutes = lazy(() => import('./routes/admin'))

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
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/portal/*" element={<CustomerRoutes />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
