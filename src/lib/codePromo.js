import { supabase } from './supabase'

// Verifie un code promo pour un utilisateur donne, et renvoie soit
// { ok: true, pourcentage, code } soit { ok: false, message }
export async function validerCodePromo(code, user) {
  const codeNormalise = (code || '').trim().toUpperCase()
  if (!codeNormalise) return { ok: false, message: 'Entre un code.' }

  const { data: promo, error } = await supabase
    .from('codes_promo')
    .select('*')
    .eq('code', codeNormalise)
    .eq('actif', true)
    .maybeSingle()

  if (error || !promo) return { ok: false, message: 'Ce code promo n\'existe pas ou n\'est plus valable.' }

  if (promo.reserve_nouveaux_clients || promo.usage_unique_par_client) {
    if (!user) return { ok: false, message: 'Connecte-toi à ton compte pour utiliser ce code.' }
  }

  if (promo.reserve_nouveaux_clients) {
    const { count } = await supabase
      .from('commandes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('statut', 'annulee')
    if (count && count > 0) {
      return { ok: false, message: 'Ce code est réservé aux nouveaux clients.' }
    }
  }

  if (promo.usage_unique_par_client) {
    const { data: dejaUtilise } = await supabase
      .from('codes_promo_utilises')
      .select('id')
      .eq('code_promo_id', promo.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (dejaUtilise) {
      return { ok: false, message: 'Tu as déjà utilisé ce code.' }
    }
  }

  return { ok: true, pourcentage: promo.pourcentage, code: promo.code, id: promo.id }
}
