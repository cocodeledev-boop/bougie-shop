import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CarteProduit from '../components/CarteProduit'
import CartePack from '../components/CartePack'
import Avis from '../components/Avis'
import WaxDivider from '../components/WaxDivider'

export default function Accueil() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [packs, setPacks] = useState([])
  const carrouselRef = useRef(null)

  useEffect(() => {
    supabase.from('produits').select('*').eq('actif', true).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setProduits(data || []))
    supabase.from('categories').select('*').order('ordre').limit(5)
      .then(({ data }) => setCategories(data || []))
    supabase.from('packs').select('*, packs_produits(quantite, produits(prix))').eq('actif', true).limit(4)
      .then(({ data }) => setPacks(data || []))
  }, [])

  function defiler(direction) {
    carrouselRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(242,166,90,0.18), transparent 55%), var(--nuit)',
        padding: '90px 0 60px'
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
              <a href="#packs" className="btn btn-secondary">Voir les packs</a>
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

      {/* Bandeau -10% nouveau client */}
      <section className="container" style={{ padding: '0 24px 50px' }}>
        <Link
          to={{ pathname: '/boutique' }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
            background: 'linear-gradient(120deg, var(--braise), var(--braise-clair))',
            borderRadius: 8, padding: '22px 30px', boxShadow: '0 10px 30px rgba(201,98,43,0.3)',
          }}
        >
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--cire)' }}>-10% sur votre première commande</p>
            <p style={{ fontSize: 14, color: 'rgba(245,232,211,0.9)' }}>Avec un compte, code « NOUVEAUBOUGIE » à coller dans le panier.</p>
          </div>
          <span style={{
            background: 'var(--nuit)', color: 'var(--flamme)', fontFamily: 'var(--font-display)',
            fontSize: 18, padding: '10px 20px', borderRadius: 6, letterSpacing: '0.04em',
          }}>
            NOUVEAUBOUGIE
          </span>
        </Link>
      </section>

      <WaxDivider />

      {/* Categories en grandes cartes */}
      {categories.length > 0 && (
        <section style={{ padding: '60px 0 20px' }}>
          <div className="container">
            <h2 style={{ fontSize: 26, marginBottom: 26 }}>Nos catégories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)`, gap: 16 }}>
              {categories.map(c => (
                <Link
                  key={c.id}
                  to="/boutique"
                  style={{
                    position: 'relative', aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                    background: 'linear-gradient(160deg, var(--bois-clair), var(--nuit) 85%)',
                    border: '1px solid var(--bois-clair)', display: 'flex', alignItems: 'flex-end', padding: 18,
                  }}
                >
                  <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--cire)' }}>{c.nom}</span>
                  <span style={{
                    position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--braise)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--cire)', fontSize: 15,
                  }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Carrousel produits */}
      <section style={{ padding: '50px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26 }}>
            <h2 style={{ fontSize: 26 }}>Les plus demandées</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => defiler(-1)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>←</button>
              <button onClick={() => defiler(1)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>→</button>
            </div>
          </div>
          {produits.length === 0 ? (
            <p style={{ color: 'var(--fumee)' }}>Les bougies arrivent bientôt.</p>
          ) : (
            <div ref={carrouselRef} style={{
              display: 'flex', gap: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 10,
            }}>
              {produits.map(p => (
                <div key={p.id} style={{ minWidth: 240, scrollSnapAlign: 'start' }}>
                  <CarteProduit produit={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Packs */}
      {packs.length > 0 && (
        <section id="packs" style={{ padding: '50px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: 26, marginBottom: 26 }}>Économisez avec nos packs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {packs.map(p => <CartePack key={p.id} pack={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Avis */}
      <section style={{ background: 'var(--bois)', padding: '60px 0', borderTop: '1px solid var(--bois-clair)' }}>
        <div className="container">
          <Avis produitId={null} />
        </div>
      </section>

      {/* Livraison / drive */}
      <section style={{ padding: '60px 0' }}>
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
