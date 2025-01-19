import { createContext } from 'react'
import { Session, User } from '@supabase/supabase-js'

export type UserProfile = {
  email: string
  full_name: string
  avatar_url: string
} & User

export type AuthContextType = {
  session: Session | null
  loading: boolean
  user: UserProfile | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const createAuthContext = () => {
  const context = createContext<AuthContextType | null>(null)
  context.displayName = 'AuthContext'
  return context
}

export default createAuthContext 