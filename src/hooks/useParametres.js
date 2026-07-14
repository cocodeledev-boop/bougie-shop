import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Recupere les reglages generaux du site (nom, logo, bannieres...) sous forme d'objet { cle: valeur }
export function useParametres() {
  const [parametres, setParametres] = useState({})
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    supabase.from('parametres_site').select('*').then(({ data }) => {
      const objet = {}
      for (const ligne of data || []) objet[ligne.cle] = ligne.valeur
      setParametres(objet)
      setChargement(false)
    })
  }, [])

  return { parametres, chargement }
}
