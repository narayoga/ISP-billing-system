import { Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import AdminHome from './AdminHome'
import AdminLogin from './AdminLogin'
import PackagesList from './packages/PackagesList'
import PackageForm from './packages/PackageForm'
import CustomersList from './customers/CustomersList'
import CustomerForm from './customers/CustomerForm'
import CustomerDetail from './customers/CustomerDetail'
import InvoicesList from './invoices/InvoicesList'
import PaymentsList from './payments/PaymentsList'
import AuditLog from './audit/AuditLog'
import { RequireAdmin } from '../guards'

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="packages" element={<PackagesList />} />
        <Route path="packages/new" element={<PackageForm />} />
        <Route path="packages/:id" element={<PackageForm />} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="invoices" element={<InvoicesList />} />
        <Route path="payments" element={<PaymentsList />} />
        <Route path="audit-log" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}
