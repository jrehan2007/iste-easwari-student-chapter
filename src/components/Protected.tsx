import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Protected({ role, children }: { role: 'admin' | 'member'; children: ReactNode }) {
  const { role: current, loading } = useAuth()
  if (loading) return <div className="container-page py-24 muted">Checking your session…</div>
  if (current !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}
