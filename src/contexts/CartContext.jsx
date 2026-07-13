import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'bougie_shop_panier'

export function CartProvider({ children }) {
  const [articles, setArticles] = useState(() => {
    try {
      const sauvegarde = localStorage.getItem(STORAGE_KEY)
      return sauvegarde ? JSON.parse(sauvegarde) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  }, [articles])

  function ajouter(produit, quantite = 1) {
    setArticles(prev => {
      const existant = prev.find(a => a.id === produit.id)
      if (existant) {
        return prev.map(a => a.id === produit.id ? { ...a, quantite: a.quantite + quantite } : a)
      }
      return [...prev, { id: produit.id, nom: produit.nom, prix: produit.prix, image_url: produit.image_url, quantite }]
    })
  }

  function modifierQuantite(produitId, quantite) {
    if (quantite <= 0) {
      retirer(produitId)
      return
    }
    setArticles(prev => prev.map(a => a.id === produitId ? { ...a, quantite } : a))
  }

  function retirer(produitId) {
    setArticles(prev => prev.filter(a => a.id !== produitId))
  }

  function vider() {
    setArticles([])
  }

  const total = articles.reduce((sum, a) => sum + a.prix * a.quantite, 0)
  const nombreArticles = articles.reduce((sum, a) => sum + a.quantite, 0)

  return (
    <CartContext.Provider value={{ articles, ajouter, modifierQuantite, retirer, vider, total, nombreArticles }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
