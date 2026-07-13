import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { suggererCouleur } from '../lib/couleursParfums'

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
        <button onClick={() => setOnglet('categories')} className={onglet === 'categories' ? 'btn btn-primary' : 'btn btn-secondary'}>
          Catégories
        </button>
        <button onClick={() => setOnglet('commandes')} className={onglet === 'commandes' ? 'btn btn-primary' : 'btn btn-secondary'}>
          Commandes
        </button>
      </div>

      {onglet === 'produits' && <GestionProduits />}
      {onglet === 'categories' && <GestionCategories />}
      {onglet === 'commandes' && <GestionCommandes />}
    </div>
  )
}

function GestionProduits() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [enEdition, setEnEdition] = useState(null)

  async function charger() {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('produits').select('*, categories(nom)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('ordre'),
    ])
    setProduits(p || [])
    setCategories(c || [])
  }

  useEffect(() => { charger() }, [])

  async function sauvegarder(form) {
    const payload = {
      nom: form.nom, description: form.description, prix: parseFloat(form.prix),
      stock: parseInt(form.stock, 10), image_url: form.image_url, parfum: form.parfum,
      actif: form.actif, categorie_id: form.categorie_id || null, couleur: form.couleur || null,
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
      {categories.length === 0 && (
        <div className="carte" style={{ padding: 14, marginBottom: 20, fontSize: 14, color: 'var(--flamme)' }}>
          Astuce : crée d'abord tes catégories dans l'onglet "Catégories" pour pouvoir les assigner à tes bougies.
        </div>
      )}

      <button className="btn btn-primary" style={{ marginBottom: 24 }} onClick={() => setEnEdition({ actif: true })}>
        + Ajouter une bougie
      </button>

      {enEdition && (
        <FormulaireProduit produit={enEdition} categories={categories} onAnnuler={() => setEnEdition(null)} onSauvegarder={sauvegarder} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {produits.map(p => (
          <div key={p.id} className="carte" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 4, background: 'var(--bois-clair)', flexShrink: 0, position: 'relative',
              backgroundImage: p.image_url ? `url(${p.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'
            }}>
              {p.couleur && (
                <span style={{
                  position: 'absolute', bottom: -4, right: -4, width: 14, height: 14, borderRadius: '50%',
                  background: p.couleur, border: '2px solid var(--bois)'
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p>{p.nom} {!p.actif && <span style={{ color: 'var(--fumee)', fontSize: 12 }}>(masqué)</span>}</p>
              <p style={{ fontSize: 13, color: 'var(--fumee)' }}>
                {p.prix.toFixed(2)} € · stock : {p.stock}
                {p.categories?.nom && <> · <span style={{ color: 'var(--flamme)' }}>{p.categories.nom}</span></>}
              </p>
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

function FormulaireProduit({ produit, categories, onAnnuler, onSauvegarder }) {
  const [form, setForm] = useState({
    id: produit.id, nom: produit.nom || '', description: produit.description || '',
    prix: produit.prix || '', stock: produit.stock ?? 0, image_url: produit.image_url || '',
    parfum: produit.parfum || '', actif: produit.actif ?? true,
    categorie_id: produit.categorie_id || '',
    couleur: produit.couleur || '',
  })

  return (
    <div className="carte" style={{ padding: 22, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="champ">
          <label>Nom</label>
          <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        </div>
        <div className="champ">
          <label>Catégorie</label>
          <select
            value={form.categorie_id}
            onChange={e => setForm({ ...form, categorie_id: e.target.value })}
            style={{ background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '12px 14px', fontSize: 15 }}
          >
            <option value="">Aucune</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="champ">
          <label>Parfum</label>
          <input
            value={form.parfum}
            onChange={e => {
              const nouveauParfum = e.target.value
              setForm(f => ({
                ...f,
                parfum: nouveauParfum,
                // Ne remplace la couleur que si elle n'a jamais été choisie à la main
                couleur: f.couleurModifieeManuelle ? f.couleur : suggererCouleur(nouveauParfum),
              }))
            }}
            placeholder="Ex : Vanille, Bois de santal, Fleur d'oranger..."
          />
        </div>
        <div className="champ">
          <label>Couleur assortie</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="color"
              value={form.couleur || '#c9622b'}
              onChange={e => setForm(f => ({ ...f, couleur: e.target.value, couleurModifieeManuelle: true }))}
              style={{ width: 44, height: 40, padding: 2, background: 'var(--bois)', border: '1.5px solid var(--bois-clair)', borderRadius: 4 }}
            />
            <span style={{ fontSize: 13, color: 'var(--fumee)' }}>
              Suggérée d'après le parfum, modifiable
            </span>
          </div>
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
        <label>Photo</label>
        <ChampPhoto valeur={form.image_url} onChange={url => setForm({ ...form, image_url: url })} />
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

function ChampPhoto({ valeur, onChange }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleFichier(e) {
    const fichier = e.target.files?.[0]
    if (!fichier) return

    setErreur('')

    if (fichier.size > 5 * 1024 * 1024) {
      setErreur('La photo est trop lourde (max 5 Mo).')
      return
    }

    setEnvoi(true)
    const extension = fichier.name.split('.').pop()
    const nomFichier = `${crypto.randomUUID()}.${extension}`

    const { error: erreurUpload } = await supabase.storage
      .from('photos-produits')
      .upload(nomFichier, fichier)

    if (erreurUpload) {
      setErreur("L'envoi de la photo a échoué.")
      setEnvoi(false)
      return
    }

    const { data } = supabase.storage.from('photos-produits').getPublicUrl(nomFichier)
    onChange(data.publicUrl)
    setEnvoi(false)
  }

  return (
    <div>
      {valeur && (
        <img
          src={valeur}
          alt="Aperçu de la bougie"
          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 10, display: 'block' }}
        />
      )}
      <input type="file" accept="image/*" onChange={handleFichier} disabled={envoi} />
      {envoi && <p style={{ fontSize: 13, color: 'var(--fumee)', marginTop: 6 }}>Envoi en cours...</p>}
      {erreur && <p style={{ fontSize: 13, color: 'var(--erreur)', marginTop: 6 }}>{erreur}</p>}
    </div>
  )
}

function GestionCategories() {
  const [categories, setCategories] = useState([])
  const [nouveauNom, setNouveauNom] = useState('')
  const [erreur, setErreur] = useState('')
  const [enEdition, setEnEdition] = useState(null)

  async function charger() {
    const { data } = await supabase.from('categories').select('*').order('ordre').order('nom')
    setCategories(data || [])
  }

  useEffect(() => { charger() }, [])

  async function ajouter(e) {
    e.preventDefault()
    setErreur('')
    if (!nouveauNom.trim()) return
    const { error } = await supabase.from('categories').insert({ nom: nouveauNom.trim(), ordre: categories.length })
    if (error) {
      setErreur(error.code === '23505' ? 'Cette catégorie existe déjà.' : "Impossible d'ajouter la catégorie.")
      return
    }
    setNouveauNom('')
    charger()
  }

  async function renommer(id, nom) {
    if (!nom.trim()) return
    await supabase.from('categories').update({ nom: nom.trim() }).eq('id', id)
    setEnEdition(null)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette catégorie ? Les bougies associées ne seront pas supprimées, juste sans catégorie.')) return
    await supabase.from('categories').delete().eq('id', id)
    charger()
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <form onSubmit={ajouter} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={nouveauNom}
          onChange={e => setNouveauNom(e.target.value)}
          placeholder="Ex : Bougies parfumées, Coffrets, Senteurs d'hiver..."
          style={{ flex: 1, background: 'var(--bois)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '12px 14px', color: 'var(--cire)', fontSize: 15 }}
        />
        <button className="btn btn-primary" type="submit">Ajouter</button>
      </form>

      {erreur && <div className="message-erreur" style={{ marginBottom: 16 }}>{erreur}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.length === 0 && <p style={{ color: 'var(--fumee)' }}>Aucune catégorie pour l'instant.</p>}
        {categories.map(c => (
          <div key={c.id} className="carte" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            {enEdition?.id === c.id ? (
              <>
                <input
                  autoFocus
                  value={enEdition.nom}
                  onChange={e => setEnEdition({ ...enEdition, nom: e.target.value })}
                  style={{ flex: 1, background: 'var(--nuit)', border: '1px solid var(--bois-clair)', borderRadius: 4, padding: '8px 10px', color: 'var(--cire)' }}
                />
                <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => renommer(c.id, enEdition.nom)}>OK</button>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setEnEdition(null)}>Annuler</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1 }}>{c.nom}</span>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setEnEdition({ id: c.id, nom: c.nom })}>
                  Renommer
                </button>
                <button onClick={() => supprimer(c.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>
                  Supprimer
                </button>
              </>
            )}
          </div>
        ))}
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
