import { supabase } from './supabase'

// Recupere, pour chaque produit, sa note moyenne et son nombre d'avis
// Renvoie une map { produit_id: { moyenne, nombre } }
export async function chargerAvisResume() {
  const { data } = await supabase.from('avis').select('produit_id, note').not('produit_id', 'is', null)
  const map = {}
  for (const a of data || []) {
    if (!map[a.produit_id]) map[a.produit_id] = { total: 0, nombre: 0 }
    map[a.produit_id].total += a.note
    map[a.produit_id].nombre += 1
  }
  const resume = {}
  for (const id in map) {
    resume[id] = { moyenne: map[id].total / map[id].nombre, nombre: map[id].nombre }
  }
  return resume
}
