import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)

  async function chargerProfil(userId) {
    const { data } = await supabase.from('profils').select('*').eq('id', userId).single()
    setProfil(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) chargerProfil(session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        chargerProfil(session.user.id)
      } else {
        setProfil(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function inscription(email, password, prenom) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { prenom } }
    })
    return { data, error }
  }

  async function connexion(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function deconnexion() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profil, loading, inscription, connexion, deconnexion, rechargerProfil: () => user && chargerProfil(user.id) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
