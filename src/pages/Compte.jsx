import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useParametres } from '../hooks/useParametres'
import { supabase } from '../lib/supabase'
import { genererFacturePDF } from '../lib/facture'

const ETAPES = [
  { statut: 'en_attente', label: 'Commande reçue', icone: '📋' },
  { statut: 'payee', label: 'Paiement confirmé', icone: '✅' },
  { statut: 'preparee', label: 'En préparation', icone: '🕯️' },
  { statut: 'expediee', label: 'Expédiée', icone: '🚚' },
  { statut: 'livree', label: 'Livrée', icone: '📦' },
]

function indexEtape(statut) {
  const i = ETAPES.findIndex(e => e.statut === statut)
  return i === -1 ? 0 : i
}

function BarreProgression({ statut }) {
  if (statut === 'annulee') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(214,69,69,0.1)', borderRadius: 8, border: '1px solid rgba(214,69,69,0.3)' }}>
      <span style={{ fontSize: 18 }}>❌</span>
      <span style={{ color: 'var(--erreur)', fontWeight: 600 }}>Commande annulée</span>
    </div>
  )
  const indexActuel = indexEtape(statut)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {ETAPES.map((etape, i) => {
          const fait = i <= indexActuel
          const actuel = i === indexActuel
          return (
            <div key={etape.statut} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Ligne de connexion */}
              {i < ETAPES.length - 1 && (
                <div style={{
                  position: 'absolute', top: 18, left: '50%', width: '100%', height: 3,
                  background: i < indexActuel ? 'var(--emeraude)' : 'var(--bois-clair)',
                  transition: 'background 0.4s ease',
                  zIndex: 0,
                }} />
              )}
              {/* Cercle */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', zIndex: 1,
                background: fait ? (actuel ? 'var(--emeraude)' : 'var(--bois-clair)') : 'var(--bois)',
                border: actuel ? '3px solid var(--emeraude-clair)' : fait ? '3px solid var(--emeraude)' : '3px solid var(--bois-clair)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: fait ? 16 : 12, boxShadow: actuel ? '0 0 16px rgba(47,143,106,0.5)' : 'none',
                transition: 'all 0.4s ease',
              }}>
                {fait ? etape.icone : <span style={{ color: 'var(--fumee)', fontSize: 11 }}>{i + 1}</span>}
              </div>
              <p style={{ fontSize: 10, color: fait ? 'var(--cire)' : 'var(--fumee)', marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>
                {etape.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Compte() {
  const { user, profil, loading } = useAuth()
  const { parametres } = useParametres()
  const [commandes, setCommandes] = useState([])
  const [commandeOuverte, setCommandeOuverte] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('commandes')
      .select('*, commande_articles(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCommandes(data || []))
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nuit)', padding: '0 0 80px' }}>
      {/* Header compte */}
      <div style={{ background: 'linear-gradient(135deg, var(--bois), var(--bois-clair))', padding: '40px 24px 32px', borderBottom: '1px solid var(--bois-clair)' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--braise)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'var(--cire)',
            }}>
              {(profil?.prenom || user.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 22, marginBottom: 2 }}>Bonjour {profil?.prenom || 'vous'} 👋</h1>
              <p style={{ fontSize: 13, color: 'var(--fumee)' }}>{user.email}</p>
            </div>
          </div>
          {/* Points fidélité */}
          <div style={{
            marginTop: 20, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--or)' }}>{profil?.points_fidelite || 0} points de fidélité</p>
              <p style={{ fontSize: 12, color: 'var(--fumee)' }}>1 point gagné par euro dépensé · contacte-nous pour les utiliser</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 700, padding: '32px 24px' }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Mes commandes ({commandes.length})</h2>

        {commandes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--fumee)' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🛍️</div>
            <p style={{ fontSize: 16, marginBottom: 8 }}>Pas encore de commande</p>
            <p style={{ fontSize: 13 }}>Découvrez nos bougies artisanales !</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {commandes.map(c => {
              const ouvert = commandeOuverte === c.id
              return (
                <div key={c.id} style={{
                  background: 'var(--bois)', border: `1px solid ${ouvert ? 'var(--emeraude)' : 'var(--bois-clair)'}`,
                  borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                }}>
                  {/* En-tête de la commande */}
                  <button
                    onClick={() => setCommandeOuverte(ouvert ? null : c.id)}
                    style={{
                      width: '100%', background: 'none', padding: '16px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 2 }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 600 }}>{c.total.toFixed(2)} €</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                        background: c.statut === 'livree' ? 'rgba(47,143,106,0.2)' :
                          c.statut === 'expediee' ? 'rgba(74,123,140,0.2)' :
                          c.statut === 'annulee' ? 'rgba(214,69,69,0.2)' : 'rgba(201,98,43,0.2)',
                        color: c.statut === 'livree' ? 'var(--emeraude-clair)' :
                          c.statut === 'expediee' ? '#6ab4c8' :
                          c.statut === 'annulee' ? 'var(--erreur)' : 'var(--flamme)',
                      }}>
                        {ETAPES.find(e => e.statut === c.statut)?.icone} {ETAPES.find(e => e.statut === c.statut)?.label || c.statut}
                      </span>
                      <span style={{ color: 'var(--fumee)', fontSize: 16 }}>{ouvert ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {ouvert && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--bois-clair)' }}>
                      {/* Barre de progression */}
                      <div style={{ paddingTop: 20, marginBottom: 20 }}>
                        <BarreProgression statut={c.statut} />
                      </div>

                      {/* Suivi de colis */}
                      {c.numero_suivi && (
                        <div style={{
                          background: 'rgba(74,123,140,0.15)', border: '1px solid rgba(74,123,140,0.4)',
                          borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{ fontSize: 20 }}>📦</span>
                          <div>
                            <p style={{ fontSize: 13, color: 'var(--cire)', fontWeight: 600 }}>
                              Numéro de suivi{c.transporteur ? ` ${c.transporteur}` : ''} : {c.numero_suivi}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 2 }}>
                              Copie ce numéro sur le site de ton transporteur pour suivre ton colis
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Livraison */}
                      <div style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 14 }}>
                        {c.mode_livraison === 'drive_fampoux' && '📍 Retrait à Fampoux'}
                        {c.mode_livraison === 'nationale' && c.adresse_livraison && `🏠 ${c.adresse_livraison}, ${c.code_postal_livraison} ${c.ville_livraison}`}
                        {c.mode_livraison === 'point_relais' && c.point_relais && `📮 Point relais : ${c.point_relais}`}
                      </div>

                      {/* Articles */}
                      <div style={{ background: 'var(--nuit)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                        {c.commande_articles?.map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                            <span>{a.quantite} × {a.nom_produit}</span>
                            <span style={{ color: 'var(--cire-douce)' }}>{(a.prix_unitaire * a.quantite).toFixed(2)} €</span>
                          </div>
                        ))}
                        {c.frais_livraison > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fumee)', marginBottom: 8 }}>
                            <span>Frais de livraison</span>
                            <span>{c.frais_livraison.toFixed(2)} €</span>
                          </div>
                        )}
                        {c.reduction_montant > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--flamme)', marginBottom: 8 }}>
                            <span>Réduction {c.code_promo && `(${c.code_promo})`}</span>
                            <span>−{c.reduction_montant.toFixed(2)} €</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--bois-clair)', paddingTop: 10, marginTop: 6 }}>
                          <span>Total payé</span>
                          <span>{c.total.toFixed(2)} €</span>
                        </div>
                      </div>

                      {/* Facture PDF */}
                      {c.statut !== 'en_attente' && c.statut !== 'annulee' && (
                        <button
                          className="btn btn-secondary" style={{ width: '100%', padding: '11px', fontSize: 14 }}
                          onClick={() => genererFacturePDF(c, parametres, { prenom: profil?.prenom, nom: profil?.nom, email: user?.email })}
                        >
                          📄 Télécharger ma facture PDF
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
