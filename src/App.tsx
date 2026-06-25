import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RoleGuard } from './components/RoleGuard'
import { Toast } from './components/Toast'
import { RootRedirect } from './pages/RootRedirect'
import { LoginPage } from './pages/LoginPage'
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage'
import { CreateShipmentPage } from './pages/customer/CreateShipmentPage'
import { OperationDashboardPage } from './pages/operation/OperationDashboardPage'
import { ShipmentDetailPage } from './pages/ShipmentDetailPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <Toast />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RoleGuard allow={['customer', 'admin']} />}>
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer/create-shipment" element={<CreateShipmentPage />} />
          </Route>

          <Route element={<RoleGuard allow={['operation', 'admin']} />}>
            <Route path="/operation/dashboard" element={<OperationDashboardPage />} />
            <Route path="/operation/create-shipment" element={<CreateShipmentPage />} />
          </Route>

          <Route element={<RoleGuard allow={['operation', 'admin', 'customer']} />}>
            <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
          </Route>

          <Route element={<RoleGuard allow={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/create-shipment" element={<CreateShipmentPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>

          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
