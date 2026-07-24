import { createClient } from '@supabase/supabase-js'
import { envoyerEmail } from './_envoyerEmail.js'

const CLES_TEXTE = {
  preparee: { cle: 'email_preparation_texte', sujet: 'Votre commande est en préparation' },
  expediee: { cle: 'email_expedition_texte', sujet: 'Votre commande est en route ! 🚚' },
  livree: { cle: 'email_livraison_texte', sujet: 'Votre commande est arrivée 🕯️' },
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 })

  try {
    const { commandeId, statut, numeroSuivi, transporteur } = await req.json()
    const config = CLES_TEXTE[statut]
    if (!config) return new Response(JSON.stringify({ ok: true, ignore: true }), { status: 200 })

    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: commande } = await supabase.from('commandes').select('user_id').eq('id', commandeId).single()
    if (!commande?.user_id) return new Response(JSON.stringify({ ok: true }), { status: 200 })

    const { data: utilisateur } = await supabase.auth.admin.getUserById(commande.user_id)
    if (!utilisateur?.user?.email) return new Response(JSON.stringify({ ok: true }), { status: 200 })

    const { data: reglage } = await supabase.from('parametres_site').select('valeur').eq('cle', config.cle).maybeSingle()
    const texte = reglage?.valeur || config.sujet

    const ligneSuivi = numeroSuivi
      ? `<p>Numéro de suivi${transporteur ? ` (${transporteur})` : ''} : <strong>${numeroSuivi}</strong></p>`
      : ''

    await envoyerEmail({
      destinataire: utilisateur.user.email,
      sujet: config.sujet,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;"><h2>${config.sujet}</h2><p>${texte}</p>${ligneSuivi}</div>`,
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ erreur: 'Erreur envoi notification' }), { status: 500 })
  }
}
