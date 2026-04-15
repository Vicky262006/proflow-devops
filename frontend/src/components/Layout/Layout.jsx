import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { PageLoader } from '../UI/LoadingSpinner'

const Layout = () => {
  const { user, loading } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar
        collapsed={mobileSidebarOpen ? false : sidebarCollapsed}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMenuToggle={() => {
            if (window.innerWidth < 1024) {
              setMobileSidebarOpen(v => !v)
            } else {
              setSidebarCollapsed(v => !v)
            }
          }}
        />
        <main className="flex-1 pt-16 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
