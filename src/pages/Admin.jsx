import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const STATUTS = ['en_attente', 'payee', 'preparee', 'expediee', 'livree', 'annulee']
const LIBELLES_STATUT = {
  en_attente: 'En attente', payee: 'Payée', preparee: 'Préparée',
  expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
}

export default function Admin() {
  const { user, profil, loading } = useAuth()
  const [onglet, setOnglet] = useState('produits')

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />
  if (!profil?.is_admin) return <Navigate to="/" />

  return (
    <div className="container" style={{ padding: '48px 24px 90px' }}>
      <h1 style={{ fontSize: 30, marginBottom: 30 }}>Espace admin</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 34 }}>
        <button onClick={() => setOnglet('produits')} className={onglet === 'produits' ? 'btn btn-primary' : 'btn btn-secondary'}>
          Produits
        </button>
        <button onClick={() => setOnglet('commandes')} className={onglet === 'commandes' ? 'btn btn-primary' : 'btn btn-secondary'}>
          Commandes
        </button>
      </div>

      {onglet === 'produits' ? <GestionProduits /> : <GestionCommandes />}
    </div>
  )
}

function GestionProduits() {
  const [produits, setProduits] = useState([])
  const [enEdition, setEnEdition] = useState(null) // null = fermé, {} = nouveau, {...} = édition

  async function charger() {
    const { data } = await supabase.from('produits').select('*').order('created_at', { ascending: false })
    setProduits(data || [])
  }

  useEffect(() => { charger() }, [])

  async function sauvegarder(form) {
    const payload = {
      nom: form.nom, description: form.description, prix: parseFloat(form.prix),
      stock: parseInt(form.stock, 10), image_url: form.image_url, parfum: form.parfum,
      actif: form.actif,
    }
    if (form.id) {
      await supabase.from('produits').update(payload).eq('id', form.id)
    } else {
      await supabase.from('produits').insert(payload)
    }
    setEnEdition(null)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette bougie ?')) return
    await supabase.from('produits').delete().eq('id', id)
    charger()
  }

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 24 }} onClick={() => setEnEdition({ actif: true })}>
        + Ajouter une bougie
      </button>

      {enEdition && (
        <FormulaireProduit produit={enEdition} onAnnuler={() => setEnEdition(null)} onSauvegarder={sauvegarder} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {produits.map(p => (
          <div key={p.id} className="carte" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 4, background: 'var(--bois-clair)', flexShrink: 0,
              backgroundImage: p.image_url ? `url(${p.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'
            }} />
            <div style={{ flex: 1 }}>
              <p>{p.nom} {!p.actif && <span style={{ color: 'var(--fumee)', fontSize: 12 }}>(masqué)</span>}</p>
              <p style={{ fontSize: 13, color: 'var(--fumee)' }}>{p.prix.toFixed(2)} € · stock : {p.stock}</p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setEnEdition(p)}>
              Modifier
            </button>
            <button onClick={() => supprimer(p.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormulaireProduit({ produit, onAnnuler, onSauvegarder }) {
  const [form, setForm] = useState({
    id: produit.id, nom: produit.nom || '', description: produit.description || '',
    prix: produit.prix || '', stock: produit.stock ?? 0, image_url: produit.image_url || '',
    parfum: produit.parfum || '', actif: produit.actif ?? true,
  })

  return (
    <div className="carte" style={{ padding: 22, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="champ">
          <label>Nom</label>
          <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        </div>
        <div className="champ">
          <label>Parfum</label>
          <input value={form.parfum} onChange={e => setForm({ ...form, parfum: e.target.value })} />
        </div>
        <div className="champ">
          <label>Prix (€)</label>
          <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} />
        </div>
        <div className="champ">
          <label>Stock</label>
          <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        </div>
      </div>
      <div className="champ">
        <label>Description</label>
        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="champ">
        <label>URL de la photo</label>
        <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 18 }}>
        <input type="checkbox" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} />
        Visible dans la boutique
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => onSauvegarder(form)}>Enregistrer</button>
        <button className="btn btn-secondary" onClick={onAnnuler}>Annuler</button>
      </div>
    </div>
  )
}

function GestionCommandes() {
  const [commandes, setCommandes] = useState([])

  async function charger() {
    const { data } = await supabase
      .from('commandes')
      .select('*, commande_articles(*)')
      .order('created_at', { ascending: false })
    setCommandes(data || [])
  }

  useEffect(() => { charger() }, [])

  async function changerStatut(id, statut) {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    charger()
  }

  if (commandes.length === 0) return <p style={{ color: 'var(--fumee)' }}>Aucune commande pour le moment.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {commandes.map(c => (
        <div key={c.id} className="carte" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--fumee)' }}>
              {new Date(c.created_at).toLocaleDateString('fr-FR')} · {c.mode_livraison === 'drive_fampoux' ? 'Retrait Fampoux' : 'Livraison'}
            </span>
            <select
              value={c.statut}
              onChange={e => changerStatut(c.id, e.target.value)}
              style={{ background: 'var(--bois)', color: 'var(--cire)', border: '1px solid var(--bois-clair)', borderRadius: 4, padding: '4px 8px' }}
            >
              {STATUTS.map(s => <option key={s} value={s}>{LIBELLES_STATUT[s]}</option>)}
            </select>
          </div>
          {c.adresse_livraison && (
            <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 8 }}>
              {c.adresse_livraison}, {c.code_postal_livraison} {c.ville_livraison}
            </p>
          )}
          <div style={{ fontSize: 14, color: 'var(--cire-douce)', marginBottom: 10 }}>
            {c.commande_articles?.map(a => (
              <div key={a.id}>{a.quantite} × {a.nom_produit}</div>
            ))}
          </div>
          <div style={{ fontWeight: 600, borderTop: '1px solid var(--bois-clair)', paddingTop: 10 }}>
            Total : {c.total.toFixed(2)} €
          </div>
        </div>
      ))}
    </div>
  )
}
