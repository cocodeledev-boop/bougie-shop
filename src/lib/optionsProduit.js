import { supabase } from './supabase'

// Recupere les options (parfums / tailles) d'une bougie personnalisable, triees par ordre
export async function chargerOptionsProduit(produitId) {
  const { data } = await supabase.from('produit_options').select('*').eq('produit_id', produitId).order('ordre')
  const parfums = (data || []).filter(o => o.type === 'parfum')
  const tailles = (data || []).filter(o => o.type === 'taille')
  return { parfums, tailles }
}
