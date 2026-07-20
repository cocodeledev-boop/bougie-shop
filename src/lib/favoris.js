import { supabase } from './supabase'

export async function estFavori(userId, produitId) {
  const { data } = await supabase.from('favoris').select('id').eq('user_id', userId).eq('produit_id', produitId).maybeSingle()
  return !!data
}

export async function basculerFavori(userId, produitId, actuellementFavori) {
  if (actuellementFavori) {
    await supabase.from('favoris').delete().eq('user_id', userId).eq('produit_id', produitId)
    return false
  }
  await supabase.from('favoris').insert({ user_id: userId, produit_id: produitId })
  return true
}
