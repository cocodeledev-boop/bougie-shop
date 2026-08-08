import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'bougie_shop_panier'
const STORAGE_KEY_CODE = 'bougie_shop_code_promo'

export function CartProvider({ children }) {
  const [articles, setArticles] = useState(() => {
    try {
      const sauvegarde = localStorage.getItem(STORAGE_KEY)
      return sauvegarde ? JSON.parse(sauvegarde) : []
    } catch {
      return []
    }
  })

  const [codePromo, setCodePromo] = useState(() => {
    try {
      const sauvegarde = localStorage.getItem(STORAGE_KEY_CODE)
      return sauvegarde ? JSON.parse(sauvegarde) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  }, [articles])

  useEffect(() => {
    if (codePromo) {
      localStorage.setItem(STORAGE_KEY_CODE, JSON.stringify(codePromo))
    } else {
      localStorage.removeItem(STORAGE_KEY_CODE)
    }
  }, [codePromo])

  function ajouter(produit, quantite = 1, options = null) {
    // "options" = { parfum: {id, nom, supplement_prix}, taille: {id, nom, supplement_prix} } ou null
    const supplement = (options?.parfum?.supplement_prix || 0) + (options?.taille?.supplement_prix || 0)
    const prixFinal = produit.prix + supplement
    const idLigne = options
      ? `${produit.id}::${options.parfum?.id || ''}::${options.taille?.id || ''}`
      : produit.id
    const detailsOptions = [options?.parfum?.nom, options?.taille?.nom].filter(Boolean).join(', ')
    const nomAffiche = detailsOptions ? `${produit.nom} (${detailsOptions})` : produit.nom

    setArticles(prev => {
      const existant = prev.find(a => a.id === idLigne)
      if (existant) {
        return prev.map(a => a.id === idLigne ? { ...a, quantite: a.quantite + quantite } : a)
      }
      return [...prev, {
        id: idLigne, produitId: produit.id, nom: nomAffiche, prix: prixFinal, image_url: produit.image_url,
        reduction_par_deux: produit.reduction_par_deux || false, quantite,
      }]
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
    setCodePromo(null)
  }

  function definirCodePromo(code) {
    setCodePromo(code)
  }

  function retirerCodePromo() {
    setCodePromo(null)
  }

  const [pointsUtilises, setPointsUtilises] = useState(0)

  // Permet de choisir precisement combien de points utiliser (par paliers de 100 = 5€).
  // Le montant est toujours borne par les points disponibles du client ET par le total
  // restant a payer (impossible d'avoir plus de reduction que le prix de la commande).
  function definirPointsUtilises(valeurSouhaitee, pointsDisponibles) {
    const bornePoints = Math.max(0, Math.min(valeurSouhaitee, pointsDisponibles))
    const arrondiPalier = Math.floor(bornePoints / 100) * 100

    const totalApresCode = codePromo ? sousTotal - sousTotal * (codePromo.pourcentage / 100) : sousTotal
    const pointsMaxParTotal = Math.floor(totalApresCode / 5) * 100

    setPointsUtilises(Math.max(0, Math.min(arrondiPalier, pointsMaxParTotal)))
  }

  function retirerPoints() {
    setPointsUtilises(0)
  }

  const reductionPoints = (pointsUtilises / 100) * 5

  // Sous-total après réduction par 2 ligne par ligne
  const sousTotal = articles.reduce((sum, a) => {
    const lignePleine = a.prix * a.quantite
    const ligneAvecRemise = (a.reduction_par_deux && a.quantite >= 2) ? lignePleine * 0.9 : lignePleine
    return sum + ligneAvecRemise
  }, 0)

  const reductionCode = codePromo ? sousTotal * (codePromo.pourcentage / 100) : 0
  const total = Math.max(0, sousTotal - reductionCode - reductionPoints)
  const nombreArticles = articles.reduce((sum, a) => sum + a.quantite, 0)

  return (
    <CartContext.Provider value={{
      articles, ajouter, modifierQuantite, retirer, vider,
      sousTotal, total, nombreArticles,
      codePromo, definirCodePromo, retirerCodePromo, reductionCode,
      pointsUtilises, definirPointsUtilises, retirerPoints, reductionPoints,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
