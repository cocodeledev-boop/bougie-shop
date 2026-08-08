import Stripe from 'stripe'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ erreur: 'Méthode non autorisée' }), { status: 405 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { commandeId, articles, reductionMontant } = await req.json()

    if (!commandeId || !articles || articles.length === 0) {
      return new Response(JSON.stringify({ erreur: 'Commande invalide.' }), { status: 400 })
    }

    const siteUrl = process.env.SITE_URL || `https://${req.headers.get('host')}`

    // Toute reduction (code promo + points fidelite) passe par UN SEUL coupon
    // en montant fixe. Stripe refuse les prix negatifs dans les line_items,
    // donc c'est la seule facon fiable de combiner les deux types de reduction.
    let discounts
    if (reductionMontant && reductionMontant > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(reductionMontant * 100),
        currency: 'eur',
        duration: 'once',
      })
      discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: articles.map(a => ({
        price_data: {
          currency: 'eur',
          product_data: { name: a.nom },
          unit_amount: Math.round(a.prix * 100),
        },
        quantity: a.quantite,
      })),
      ...(discounts ? { discounts } : {}),
      metadata: { commande_id: commandeId },
      success_url: `${siteUrl}/commande-succes`,
      cancel_url: `${siteUrl}/commande`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ erreur: 'Impossible de créer le paiement.' }), { status: 500 })
  }
}
