import { useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { auth } from '../lib/auth'
import createAuthContext, { UserProfile } from './createAuthContext'

const AuthContext = createAuthContext()

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const updateUserProfile = (user: User | null) => {
    if (!user) {
      setUser(null)
      return
    }

    setUser({
      ...user,
      full_name: user.user_metadata.full_name || '',
      avatar_url: user.user_metadata.avatar_url || '',
      email: user.email || ''
    })
  }

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      updateUserProfile(session?.user || null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setSession(session)
      updateUserProfile(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    loading,
    user,
    signInWithGoogle: auth.signInWithGoogle,
    signOut: auth.signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export { AuthContext } 