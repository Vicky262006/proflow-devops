import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'
import AdminLayout from './layouts/AdminLayout'
import EmployeeLayout from './layouts/EmployeeLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import Tasks from './pages/Tasks'
import Teams from './pages/Teams'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'

const RootRedirect = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="teams" element={<Teams />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Employee Routes */}
                <Route path="/employee" element={<EmployeeLayout />}>
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="teams" element={<Teams />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Common Protected Routes (Wrapped in generic logic via conditional redirect) */}
                <Route path="/profile" element={<Profile />} />

                {/* Smart root redirect based on auth state */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </BrowserRouter>

            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0f172a',
                  color: '#f1f5f9',
                  borderRadius: '1.5rem',
                  padding: '16px 24px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid #1e293b'
                },
                success: {
                  iconTheme: { primary: '#6366f1', secondary: '#fff' },
                },
              }}
            />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
