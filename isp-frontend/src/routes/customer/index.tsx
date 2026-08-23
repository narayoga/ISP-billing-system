import { Routes, Route } from 'react-router-dom'
import CustomerLayout from './CustomerLayout'
import CustomerHome from './CustomerHome'
import CustomerLogin from './CustomerLogin'
import CustomerSetPassword from './CustomerSetPassword'
import { RequireCustomer } from '../guards'

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route path="login" element={<CustomerLogin />} />
      <Route path="set-password" element={<CustomerSetPassword />} />
      <Route
        element={
          <RequireCustomer>
            <CustomerLayout />
          </RequireCustomer>
        }
      >
        <Route index element={<CustomerHome />} />
      </Route>
    </Routes>
  )
}
