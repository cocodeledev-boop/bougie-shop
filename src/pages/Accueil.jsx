import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CarteProduit from '../components/CarteProduit'
import WaxDivider from '../components/WaxDivider'

export default function Accueil() {
  const [produits, setProduits] = useState([])

  useEffect(() => {
    supabase.from('produits').select('*').eq('actif', true).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setProduits(data || []))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(242,166,90,0.18), transparent 55%), var(--nuit)',
        padding: '110px 0 90px'
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--flamme)', fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
              Cire naturelle · fabrication en petites séries
            </p>
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 58px)', marginBottom: 22 }}>
              Une flamme qui <em style={{ fontStyle: 'italic', color: 'var(--flamme)' }}>ralentit</em> le temps.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--cire-douce)', maxWidth: 460, marginBottom: 34, lineHeight: 1.6 }}>
              Bougies coulées à la main, parfums choisis un à un. Livrées partout en France,
              ou à retirer directement à Fampoux.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              <Link to="/boutique" className="btn btn-primary">Découvrir la boutique</Link>
              <a href="#histoire" className="btn btn-secondary">Notre histoire</a>
            </div>
          </div>
          <div style={{
            aspectRatio: '4/5', borderRadius: 8,
            background: 'linear-gradient(160deg, var(--bois-clair), var(--bois) 70%)',
            border: '1px solid var(--bois-clair)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'var(--fumee)', fontSize: 14 }}>Photo de bougie à ajouter</span>
          </div>
        </div>
      </section>

      <WaxDivider />

      {/* Produits phares */}
      <section style={{ padding: '70px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <h2 style={{ fontSize: 30 }}>Les plus demandées</h2>
            <Link to="/boutique" style={{ color: 'var(--flamme)', fontSize: 15 }}>Voir tout →</Link>
          </div>
          {produits.length === 0 ? (
            <p style={{ color: 'var(--fumee)' }}>Les bougies arrivent bientôt.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
              {produits.map(p => <CarteProduit key={p.id} produit={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Livraison / drive */}
      <section id="histoire" style={{ background: 'var(--bois)', padding: '64px 0', borderTop: '1px solid var(--bois-clair)', borderBottom: '1px solid var(--bois-clair)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <h3 style={{ fontSize: 22, marginBottom: 10, color: 'var(--flamme)' }}>Livraison nationale</h3>
            <p style={{ color: 'var(--cire-douce)', lineHeight: 1.6 }}>
              Expédiée sous 2 à 4 jours, emballée avec soin pour arriver intacte chez vous, partout en France.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: 22, marginBottom: 10, color: 'var(--flamme)' }}>Retrait à Fampoux</h3>
            <p style={{ color: 'var(--cire-douce)', lineHeight: 1.6 }}>
              Passez récupérer votre commande directement sur place, sans frais de port, à Fampoux (62).
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
