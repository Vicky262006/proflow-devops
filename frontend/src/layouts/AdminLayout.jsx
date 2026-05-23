import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Layout/Sidebar'
import Navbar from '../components/Layout/Navbar'

const AdminLayout = () => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading Enterprise...</div>
  if (!user || !isAdmin) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
