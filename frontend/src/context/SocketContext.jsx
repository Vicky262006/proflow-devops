import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { token, user } = useAuth()

  useEffect(() => {
    if (!token || !user) return

    const socketUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
    })

    newSocket.on('user:online', (data) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev
        return [...prev, data]
      })
    })

    newSocket.on('user:offline', (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId))
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
      setSocket(null)
    }
  }, [token, user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
