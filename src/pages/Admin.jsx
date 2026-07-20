import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { suggererCouleur, PALETTE_PASTILLES } from '../lib/couleursParfums'
import { compresserImage } from '../lib/compresserImage'

const STATUTS = ['en_attente', 'payee', 'preparee', 'expediee', 'livree', 'annulee']
const LIBELLES_STATUT = {
  en_attente: 'En attente', payee: 'Payée', preparee: 'Préparée',
  expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
}
const ONGLETS = [
  ['produits', 'Produits'], ['categories', 'Catégories'], ['packs', 'Packs'],
  ['codes', 'Codes promo'], ['avis', 'Avis'], ['commandes', 'Commandes'], ['reglages', 'Réglages'],
]

export default function Admin() {
  const { user, profil, loading } = useAuth()
  const [onglet, setOnglet] = useState('produits')

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />
  if (!profil?.is_admin) return <Navigate to="/" />

  return (
    <div className="container" style={{ padding: '48px 24px 90px' }}>
      <h1 style={{ fontSize: 30, marginBottom: 30 }}>Espace admin</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 34, flexWrap: 'wrap' }}>
        {ONGLETS.map(([valeur, libelle]) => (
          <button key={valeur} onClick={() => setOnglet(valeur)} className={onglet === valeur ? 'btn btn-primary' : 'btn btn-secondary'}>
            {libelle}
          </button>
        ))}
      </div>

      {onglet === 'produits' && <GestionProduits />}
      {onglet === 'categories' && <GestionCategories />}
      {onglet === 'packs' && <GestionPacks />}
      {onglet === 'codes' && <GestionCodesPromo />}
      {onglet === 'avis' && <GestionAvis />}
      {onglet === 'commandes' && <GestionCommandes />}
      {onglet === 'reglages' && <GestionReglages />}
    </div>
  )
}

/* ---------- PRODUITS ---------- */

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
      stock: parseInt(form.stock, 10), image_url: form.image_url, image_url_secondaire: form.image_url_secondaire,
      parfum: form.parfum, actif: form.actif, categorie_id: form.categorie_id || null,
      couleur: form.couleur || null,
      prix_barre: form.prix_barre ? parseFloat(form.prix_barre) : null,
      reduction_par_deux: form.reduction_par_deux, coup_de_coeur: form.coup_de_coeur,
      personnalisable: form.personnalisable,
    }
    let produitId = form.id
    if (produitId) {
      await supabase.from('produits').update(payload).eq('id', produitId)
    } else {
      const { data } = await supabase.from('produits').insert(payload).select().single()
      produitId = data.id
    }

    // On remplace toutes les options de personnalisation par la liste actuelle du formulaire
    await supabase.from('produit_options').delete().eq('produit_id', produitId)
    const optionsAEnregistrer = (form.options || [])
      .filter(o => o.nom.trim())
      .map((o, i) => ({ produit_id: produitId, type: o.type, nom: o.nom.trim(), supplement_prix: parseFloat(o.supplement_prix) || 0, ordre: i }))
    if (optionsAEnregistrer.length > 0) await supabase.from('produit_options').insert(optionsAEnregistrer)

    await supabase.from('produit_photos').delete().eq('produit_id', produitId)
    const photosAEnregistrer = (form.photosSupplementaires || []).filter(Boolean).map((url, i) => ({ produit_id: produitId, url, ordre: i }))
    if (photosAEnregistrer.length > 0) await supabase.from('produit_photos').insert(photosAEnregistrer)

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
                <span style={{ position: 'absolute', bottom: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: p.couleur, border: '2px solid var(--bois)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p>{p.nom} {!p.actif && <span style={{ color: 'var(--fumee)', fontSize: 12 }}>(masqué)</span>}</p>
              <p style={{ fontSize: 13, color: 'var(--fumee)' }}>
                {p.prix.toFixed(2)} € · stock : {p.stock}
                {p.categories?.nom && <> · <span style={{ color: 'var(--flamme)' }}>{p.categories.nom}</span></>}
                {p.reduction_par_deux && <> · <span style={{ color: 'var(--flamme)' }}>2=-10%</span></>}
                {p.coup_de_coeur && <> · <span style={{ color: 'var(--or)' }}>★ coup de cœur</span></>}
              </p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={async () => {
              const [{ data: opts }, { data: photos }] = await Promise.all([
                supabase.from('produit_options').select('*').eq('produit_id', p.id).order('ordre'),
                supabase.from('produit_photos').select('*').eq('produit_id', p.id).order('ordre'),
              ])
              setEnEdition({
                ...p,
                options: (opts || []).map(o => ({ type: o.type, nom: o.nom, supplement_prix: o.supplement_prix })),
                photosSupplementaires: (photos || []).map(ph => ph.url),
              })
            }}>Modifier</button>
            <button onClick={() => supprimer(p.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>Supprimer</button>
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
    image_url_secondaire: produit.image_url_secondaire || '',
    parfum: produit.parfum || '', actif: produit.actif ?? true,
    categorie_id: produit.categorie_id || '', couleur: produit.couleur || '',
    prix_barre: produit.prix_barre || '', reduction_par_deux: produit.reduction_par_deux || false,
    coup_de_coeur: produit.coup_de_coeur || false,
    personnalisable: produit.personnalisable || false,
    options: produit.options || [],
    photosSupplementaires: produit.photosSupplementaires || [],
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
          <label>Prix (€)</label>
          <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} />
        </div>
        <div className="champ">
          <label>Prix barré (optionnel, pour une promo)</label>
          <input type="number" step="0.01" value={form.prix_barre} onChange={e => setForm({ ...form, prix_barre: e.target.value })} placeholder="Ex : 24.90" />
        </div>
        <div className="champ">
          <label>Stock</label>
          <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
        </div>
      </div>

      <div className="champ">
        <label>Parfum</label>
        <input
          value={form.parfum}
          onChange={e => {
            const nouveauParfum = e.target.value
            setForm(f => ({ ...f, parfum: nouveauParfum, couleur: f.couleurModifieeManuelle ? f.couleur : suggererCouleur(nouveauParfum) }))
          }}
          placeholder="Ex : Vanille, Bois de santal, Fleur d'oranger..."
        />
      </div>

      <div className="champ">
        <label>Couleur assortie</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {PALETTE_PASTILLES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, couleur: c, couleurModifieeManuelle: true }))}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: c, padding: 0,
                border: form.couleur === c ? '3px solid var(--cire)' : '2px solid rgba(0,0,0,0.2)',
              }}
              aria-label={`Choisir la couleur ${c}`}
            />
          ))}
          <input
            type="color"
            value={form.couleur || '#c9622b'}
            onChange={e => setForm(f => ({ ...f, couleur: e.target.value, couleurModifieeManuelle: true }))}
            style={{ width: 36, height: 30, padding: 2, background: 'var(--bois)', border: '1.5px solid var(--bois-clair)', borderRadius: 4 }}
            title="Couleur personnalisée"
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 4 }}>Suggérée automatiquement selon le parfum tapé, cliquable pour ajuster.</p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12 }}>
        <input type="checkbox" checked={form.coup_de_coeur} onChange={e => setForm({ ...form, coup_de_coeur: e.target.checked })} />
        Mettre en avant comme "Coup de cœur" (badge doré, section dédiée sur l'accueil)
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16 }}>
        <input type="checkbox" checked={form.reduction_par_deux} onChange={e => setForm({ ...form, reduction_par_deux: e.target.checked })} />
        Offrir -10% dès que le client en achète 2
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16 }}>
        <input type="checkbox" checked={form.personnalisable} onChange={e => setForm({ ...form, personnalisable: e.target.checked })} />
        Bougie personnalisable (le client choisit un parfum et/ou une taille)
      </label>

      {form.personnalisable && <GestionOptionsProduit form={form} setForm={setForm} />}

      <div className="champ">
        <label>Description</label>
        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="champ">
          <label>Photo principale</label>
          <ChampPhoto valeur={form.image_url} onChange={url => setForm({ ...form, image_url: url })} />
        </div>
        <div className="champ">
          <label>Photo secondaire (affichée au survol dans la boutique)</label>
          <ChampPhoto valeur={form.image_url_secondaire} onChange={url => setForm({ ...form, image_url_secondaire: url })} />
        </div>
      </div>

      <div className="champ">
        <label>Photos supplémentaires (galerie sur la fiche produit)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
          {form.photosSupplementaires.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={url} alt={`Photo ${i + 3}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, photosSupplementaires: f.photosSupplementaires.filter((_, idx) => idx !== i) }))}
                style={{ position: 'absolute', top: -8, right: -8, background: 'var(--erreur)', color: 'var(--cire)', borderRadius: '50%', width: 22, height: 22, fontSize: 13 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <ChampPhoto valeur={null} onChange={url => setForm(f => ({ ...f, photosSupplementaires: [...f.photosSupplementaires, url] }))} />
        <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 4 }}>Ajoute une photo à la fois, elle s'ajoutera à la galerie ci-dessus.</p>
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

function GestionOptionsProduit({ form, setForm }) {
  function ajouterOption(type) {
    setForm(f => ({ ...f, options: [...f.options, { type, nom: '', supplement_prix: 0 }] }))
  }
  function majOption(index, champ, valeur) {
    setForm(f => ({ ...f, options: f.options.map((o, i) => i === index ? { ...o, [champ]: valeur } : o) }))
  }
  function supprimerOption(index) {
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== index) }))
  }

  const parfums = form.options.map((o, i) => ({ ...o, index: i })).filter(o => o.type === 'parfum')
  const tailles = form.options.map((o, i) => ({ ...o, index: i })).filter(o => o.type === 'taille')

  return (
    <div className="carte" style={{ padding: 16, marginBottom: 18 }}>
      <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 12 }}>
        Laisse le supplément à 0 si l'option n'ajoute rien au prix.
      </p>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Parfums proposés</p>
      {parfums.map(o => (
        <LigneOption key={o.index} option={o} onMaj={(champ, val) => majOption(o.index, champ, val)} onSupprimer={() => supprimerOption(o.index)} />
      ))}
      <button type="button" className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 12, marginBottom: 16 }} onClick={() => ajouterOption('parfum')}>
        + Ajouter un parfum
      </button>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tailles proposées</p>
      {tailles.map(o => (
        <LigneOption key={o.index} option={o} onMaj={(champ, val) => majOption(o.index, champ, val)} onSupprimer={() => supprimerOption(o.index)} />
      ))}
      <button type="button" className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => ajouterOption('taille')}>
        + Ajouter une taille
      </button>
    </div>
  )
}

function LigneOption({ option, onMaj, onSupprimer }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
      <input
        value={option.nom} onChange={e => onMaj('nom', e.target.value)}
        placeholder={option.type === 'parfum' ? 'Ex : Vanille' : 'Ex : Petit (150g)'}
        style={{ flex: 1, background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
      />
      <input
        type="number" step="0.01" value={option.supplement_prix}
        onChange={e => onMaj('supplement_prix', e.target.value)}
        placeholder="+0.00€"
        style={{ width: 90, background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '8px 10px', fontSize: 13 }}
      />
      <button type="button" onClick={onSupprimer} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>✕</button>
    </div>
  )
}

function ChampPhoto({ valeur, onChange }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleFichier(e) {
    const fichierOriginal = e.target.files?.[0]
    if (!fichierOriginal) return
    setErreur('')
    if (fichierOriginal.size > 15 * 1024 * 1024) {
      setErreur('La photo est trop lourde (max 15 Mo).')
      return
    }
    setEnvoi(true)
    let fichier
    try {
      fichier = await compresserImage(fichierOriginal)
    } catch {
      fichier = fichierOriginal
    }
    const nomFichier = `${crypto.randomUUID()}.jpg`
    const { error: erreurUpload } = await supabase.storage.from('photos-produits').upload(nomFichier, fichier)
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
      {valeur && <img src={valeur} alt="Aperçu" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 4, marginBottom: 10, display: 'block' }} />}
      <input type="file" accept="image/*" onChange={handleFichier} disabled={envoi} />
      {envoi && <p style={{ fontSize: 13, color: 'var(--fumee)', marginTop: 6 }}>Envoi en cours...</p>}
      {erreur && <p style={{ fontSize: 13, color: 'var(--erreur)', marginTop: 6 }}>{erreur}</p>}
    </div>
  )
}

/* ---------- CATEGORIES ---------- */

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

  async function changerPhoto(id, url) {
    await supabase.from('categories').update({ image_url: url }).eq('id', id)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette catégorie ?')) return
    await supabase.from('categories').delete().eq('id', id)
    charger()
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <form onSubmit={ajouter} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={nouveauNom} onChange={e => setNouveauNom(e.target.value)}
          placeholder="Ex : Bougies parfumées, Coffrets..."
          style={{ flex: 1, background: 'var(--bois)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '12px 14px', color: 'var(--cire)', fontSize: 15 }}
        />
        <button className="btn btn-primary" type="submit">Ajouter</button>
      </form>
      {erreur && <div className="message-erreur" style={{ marginBottom: 16 }}>{erreur}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.length === 0 && <p style={{ color: 'var(--fumee)' }}>Aucune catégorie pour l'instant.</p>}
        {categories.map(c => (
          <div key={c.id} className="carte" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {enEdition?.id === c.id ? (
                <>
                  <input autoFocus value={enEdition.nom} onChange={e => setEnEdition({ ...enEdition, nom: e.target.value })}
                    style={{ flex: 1, background: 'var(--nuit)', border: '1px solid var(--bois-clair)', borderRadius: 4, padding: '8px 10px', color: 'var(--cire)' }} />
                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => renommer(c.id, enEdition.nom)}>OK</button>
                  <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setEnEdition(null)}>Annuler</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>{c.nom}</span>
                  <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setEnEdition({ id: c.id, nom: c.nom })}>Renommer</button>
                  <button onClick={() => supprimer(c.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>Supprimer</button>
                </>
              )}
            </div>
            <ChampPhoto valeur={c.image_url} onChange={url => changerPhoto(c.id, url)} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- PACKS ---------- */

function GestionPacks() {
  const [packs, setPacks] = useState([])
  const [produits, setProduits] = useState([])
  const [enEdition, setEnEdition] = useState(null)

  async function charger() {
    const [{ data: p }, { data: prod }] = await Promise.all([
      supabase.from('packs').select('*, packs_produits(*, produits(nom, prix))').order('created_at', { ascending: false }),
      supabase.from('produits').select('id, nom, prix').order('nom'),
    ])
    setPacks(p || [])
    setProduits(prod || [])
  }

  useEffect(() => { charger() }, [])

  async function sauvegarder(form) {
    const payload = { nom: form.nom, description: form.description, prix: parseFloat(form.prix), image_url: form.image_url, actif: form.actif }
    let packId = form.id
    if (packId) {
      await supabase.from('packs').update(payload).eq('id', packId)
      await supabase.from('packs_produits').delete().eq('pack_id', packId)
    } else {
      const { data } = await supabase.from('packs').insert(payload).select().single()
      packId = data.id
    }
    const lignes = form.composition.filter(l => l.produit_id).map(l => ({ pack_id: packId, produit_id: l.produit_id, quantite: l.quantite }))
    if (lignes.length > 0) await supabase.from('packs_produits').insert(lignes)
    setEnEdition(null)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer ce pack ?')) return
    await supabase.from('packs').delete().eq('id', id)
    charger()
  }

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 24 }} onClick={() => setEnEdition({ actif: true, composition: [{ produit_id: '', quantite: 1 }] })}>
        + Créer un pack
      </button>

      {enEdition && (
        <FormulairePack pack={enEdition} produits={produits} onAnnuler={() => setEnEdition(null)} onSauvegarder={sauvegarder} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {packs.map(p => (
          <div key={p.id} className="carte" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <p>{p.nom} {!p.actif && <span style={{ color: 'var(--fumee)', fontSize: 12 }}>(masqué)</span>}</p>
                <p style={{ fontSize: 13, color: 'var(--fumee)' }}>{p.prix.toFixed(2)} €</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}
                onClick={() => setEnEdition({ ...p, composition: p.packs_produits.map(l => ({ produit_id: l.produit_id, quantite: l.quantite })) })}>
                Modifier
              </button>
              <button onClick={() => supprimer(p.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>Supprimer</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--fumee)' }}>
              Contient : {p.packs_produits.map(l => `${l.quantite} × ${l.produits?.nom}`).join(', ') || 'rien pour l\'instant'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormulairePack({ pack, produits, onAnnuler, onSauvegarder }) {
  const [form, setForm] = useState({
    id: pack.id, nom: pack.nom || '', description: pack.description || '',
    prix: pack.prix || '', image_url: pack.image_url || '', actif: pack.actif ?? true,
    composition: pack.composition || [{ produit_id: '', quantite: 1 }],
  })

  function majLigne(index, champ, valeur) {
    setForm(f => ({ ...f, composition: f.composition.map((l, i) => i === index ? { ...l, [champ]: valeur } : l) }))
  }

  return (
    <div className="carte" style={{ padding: 22, marginBottom: 24 }}>
      <div className="champ"><label>Nom du pack</label>
        <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex : Pack Cocooning" />
      </div>
      <div className="champ"><label>Description</label>
        <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="champ"><label>Prix du pack (€)</label>
        <input type="number" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} />
      </div>
      <div className="champ"><label>Photo</label>
        <ChampPhoto valeur={form.image_url} onChange={url => setForm({ ...form, image_url: url })} />
      </div>

      <label style={{ fontSize: 13, color: 'var(--fumee)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Bougies incluses</label>
      {form.composition.map((ligne, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <select
            value={ligne.produit_id}
            onChange={e => majLigne(i, 'produit_id', e.target.value)}
            style={{ flex: 1, background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '10px 12px' }}
          >
            <option value="">Choisir une bougie</option>
            {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.prix.toFixed(2)} €)</option>)}
          </select>
          <input
            type="number" min="1" value={ligne.quantite}
            onChange={e => majLigne(i, 'quantite', parseInt(e.target.value, 10) || 1)}
            style={{ width: 70, background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '10px 12px' }}
          />
        </div>
      ))}
      <button
        type="button" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13, marginBottom: 18 }}
        onClick={() => setForm(f => ({ ...f, composition: [...f.composition, { produit_id: '', quantite: 1 }] }))}
      >
        + Ajouter une bougie au pack
      </button>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 18 }}>
        <input type="checkbox" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} />
        Visible sur le site
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => onSauvegarder(form)}>Enregistrer</button>
        <button className="btn btn-secondary" onClick={onAnnuler}>Annuler</button>
      </div>
    </div>
  )
}

/* ---------- CODES PROMO ---------- */

function GestionCodesPromo() {
  const [codes, setCodes] = useState([])
  const [form, setForm] = useState({ code: '', pourcentage: 10, reserve_nouveaux_clients: false, usage_unique_par_client: true, date_fin: '' })
  const [erreur, setErreur] = useState('')

  async function charger() {
    const { data } = await supabase.from('codes_promo').select('*').order('created_at', { ascending: false })
    setCodes(data || [])
  }

  useEffect(() => { charger() }, [])

  async function ajouter(e) {
    e.preventDefault()
    setErreur('')
    if (!form.code.trim()) return
    const { error } = await supabase.from('codes_promo').insert({
      code: form.code.trim().toUpperCase(), pourcentage: parseFloat(form.pourcentage),
      reserve_nouveaux_clients: form.reserve_nouveaux_clients, usage_unique_par_client: form.usage_unique_par_client,
      date_fin: form.date_fin || null,
    })
    if (error) {
      setErreur(error.code === '23505' ? 'Ce code existe déjà.' : 'Erreur lors de la création.')
      return
    }
    setForm({ code: '', pourcentage: 10, reserve_nouveaux_clients: false, usage_unique_par_client: true, date_fin: '' })
    charger()
  }

  async function basculerActif(id, actif) {
    await supabase.from('codes_promo').update({ actif: !actif }).eq('id', id)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer ce code promo ?')) return
    await supabase.from('codes_promo').delete().eq('id', id)
    charger()
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <form onSubmit={ajouter} className="carte" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 14 }}>
          <div className="champ"><label>Code</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex : ETE2026" />
          </div>
          <div className="champ"><label>% réduction</label>
            <input type="number" value={form.pourcentage} onChange={e => setForm({ ...form, pourcentage: e.target.value })} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 10 }}>
          <input type="checkbox" checked={form.reserve_nouveaux_clients} onChange={e => setForm({ ...form, reserve_nouveaux_clients: e.target.checked })} />
          Réservé aux nouveaux clients (jamais commandé)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16 }}>
          <input type="checkbox" checked={form.usage_unique_par_client} onChange={e => setForm({ ...form, usage_unique_par_client: e.target.checked })} />
          Utilisable une seule fois par client
        </label>
        <div className="champ">
          <label>Date de fin (optionnel — affiche un compte à rebours si utilisé dans la bannière d'accueil)</label>
          <input type="datetime-local" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
        </div>
        {erreur && <div className="message-erreur" style={{ marginBottom: 14 }}>{erreur}</div>}
        <button className="btn btn-primary" type="submit">Créer le code</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {codes.map(c => (
          <div key={c.id} className="carte" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{c.code} — {c.pourcentage}%</p>
              <p style={{ fontSize: 12, color: 'var(--fumee)' }}>
                {c.reserve_nouveaux_clients ? 'Nouveaux clients uniquement' : 'Tout le monde'} · {c.usage_unique_par_client ? 'usage unique' : 'réutilisable'}
              </p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => basculerActif(c.id, c.actif)}>
              {c.actif ? 'Actif' : 'Désactivé'}
            </button>
            <button onClick={() => supprimer(c.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- AVIS ---------- */

function GestionAvis() {
  const [avis, setAvis] = useState([])
  const [produits, setProduits] = useState([])
  const [form, setForm] = useState({ produit_id: '', auteur: '', note: 5, commentaire: '' })

  async function charger() {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from('avis').select('*, produits(nom)').order('created_at', { ascending: false }),
      supabase.from('produits').select('id, nom').order('nom'),
    ])
    setAvis(a || [])
    setProduits(p || [])
  }

  useEffect(() => { charger() }, [])

  async function ajouter(e) {
    e.preventDefault()
    if (!form.auteur.trim() || !form.commentaire.trim()) return
    await supabase.from('avis').insert({
      produit_id: form.produit_id || null, auteur: form.auteur.trim(),
      note: form.note, commentaire: form.commentaire.trim(),
    })
    setForm({ produit_id: '', auteur: '', note: 5, commentaire: '' })
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cet avis ?')) return
    await supabase.from('avis').delete().eq('id', id)
    charger()
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <form onSubmit={ajouter} className="carte" style={{ padding: 20, marginBottom: 24 }}>
        <div className="champ"><label>Bougie concernée (optionnel — vide = avis général)</label>
          <select
            value={form.produit_id} onChange={e => setForm({ ...form, produit_id: e.target.value })}
            style={{ background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '12px 14px' }}
          >
            <option value="">Avis général (page d'accueil)</option>
            {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div className="champ"><label>Auteur</label>
          <input value={form.auteur} onChange={e => setForm({ ...form, auteur: e.target.value })} placeholder="Ex : Marie P." />
        </div>
        <div className="champ"><label>Note</label>
          <select value={form.note} onChange={e => setForm({ ...form, note: parseInt(e.target.value, 10) })}
            style={{ background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '12px 14px' }}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
          </select>
        </div>
        <div className="champ"><label>Commentaire</label>
          <textarea rows={3} value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit">Ajouter l'avis</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {avis.map(a => (
          <div key={a.id} className="carte" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--flamme)', fontSize: 13 }}>{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)} — {a.auteur}</p>
              <p style={{ fontSize: 13, color: 'var(--cire-douce)' }}>{a.commentaire}</p>
              <p style={{ fontSize: 12, color: 'var(--fumee)' }}>{a.produits?.nom || 'Avis général'}</p>
            </div>
            <button onClick={() => supprimer(a.id)} style={{ background: 'none', color: 'var(--erreur)', fontSize: 13 }}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- REGLAGES DU SITE ---------- */

function GestionReglages() {
  const [valeurs, setValeurs] = useState({})
  const [chargement, setChargement] = useState(true)
  const [enregistre, setEnregistre] = useState(false)

  async function charger() {
    const { data } = await supabase.from('parametres_site').select('*')
    const objet = {}
    for (const ligne of data || []) objet[ligne.cle] = ligne.valeur || ''
    setValeurs(objet)
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  function definir(cle, valeur) {
    setValeurs(v => ({ ...v, [cle]: valeur }))
  }

  async function enregistrer() {
    const lignes = Object.entries(valeurs).map(([cle, valeur]) => ({ cle, valeur }))
    await supabase.from('parametres_site').upsert(lignes, { onConflict: 'cle' })
    setEnregistre(true)
    setTimeout(() => setEnregistre(false), 2500)
  }

  if (chargement) return <p style={{ color: 'var(--fumee)' }}>Chargement...</p>

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="champ">
        <label>Nom de la boutique</label>
        <input value={valeurs.nom_boutique || ''} onChange={e => definir('nom_boutique', e.target.value)} />
      </div>

      <div className="champ">
        <label>Logo (remplace la petite flamme dans le menu)</label>
        <ChampPhoto valeur={valeurs.logo_url} onChange={url => definir('logo_url', url)} />
      </div>

      <div className="champ">
        <label>Grande photo d'accueil (à droite du titre)</label>
        <ChampPhoto valeur={valeurs.image_hero_url} onChange={url => definir('image_hero_url', url)} />
      </div>

      <div className="champ">
        <label>Titre de la bannière promo</label>
        <input value={valeurs.banniere_titre || ''} onChange={e => definir('banniere_titre', e.target.value)} />
      </div>
      <div className="champ">
        <label>Sous-titre de la bannière</label>
        <input value={valeurs.banniere_sous_titre || ''} onChange={e => definir('banniere_sous_titre', e.target.value)} />
      </div>
      <div className="champ">
        <label>Code affiché dans la bannière</label>
        <input value={valeurs.banniere_code || ''} onChange={e => definir('banniere_code', e.target.value.toUpperCase())} />
        <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 4 }}>
          Doit correspondre à un code créé dans l'onglet "Codes promo" pour fonctionner vraiment.
        </p>
      </div>

      <div className="champ">
        <label>Texte de la page "Notre histoire" (À propos)</label>
        <textarea rows={5} value={valeurs.a_propos_texte || ''} onChange={e => definir('a_propos_texte', e.target.value)} />
      </div>

      <div className="champ">
        <label>Meta Pixel ID (Facebook/Instagram Ads — optionnel)</label>
        <input value={valeurs.meta_pixel_id || ''} onChange={e => definir('meta_pixel_id', e.target.value)} placeholder="Ex : 1234567890123456" />
        <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 4 }}>
          Trouvable dans Meta Business Suite → Gestionnaire d'événements.
        </p>
      </div>

      <div className="champ">
        <label>TikTok Pixel ID (optionnel)</label>
        <input value={valeurs.tiktok_pixel_id || ''} onChange={e => definir('tiktok_pixel_id', e.target.value)} placeholder="Ex : C1A2B3C4D5E6F7G8" />
        <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 4 }}>
          Trouvable dans TikTok Ads Manager → Bibliothèque d'événements.
        </p>
      </div>

      <button className="btn btn-primary" onClick={enregistrer}>Enregistrer les réglages</button>
      {enregistre && <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--emeraude-clair)' }}>Enregistré ✓</span>}
    </div>
  )
}

/* ---------- COMMANDES ---------- */

function GestionCommandes() {
  const [commandes, setCommandes] = useState([])

  async function charger() {
    const { data } = await supabase.from('commandes').select('*, commande_articles(*)').order('created_at', { ascending: false })
    setCommandes(data || [])
  }

  useEffect(() => { charger() }, [])

  async function changerStatut(id, statut) {
    await supabase.from('commandes').update({ statut }).eq('id', id)
    fetch('/.netlify/functions/notifier-statut-commande', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandeId: id, statut }),
    }).catch(() => {})
    charger()
  }

  function exporterCSV() {
    const entetes = ['Date', 'Statut', 'Total', 'Mode livraison', 'Code promo', 'Articles']
    const lignes = commandes.map(c => [
      new Date(c.created_at).toLocaleDateString('fr-FR'),
      LIBELLES_STATUT[c.statut] || c.statut,
      c.total.toFixed(2),
      c.mode_livraison === 'drive_fampoux' ? 'Retrait Fampoux' : 'Livraison',
      c.code_promo || '',
      (c.commande_articles || []).map(a => `${a.quantite}x ${a.nom_produit}`).join(' | '),
    ])
    const csv = [entetes, ...lignes].map(ligne => ligne.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(blob)
    lien.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`
    lien.click()
  }

  const commandesPayees = commandes.filter(c => c.statut !== 'en_attente' && c.statut !== 'annulee')
  const chiffreAffaires = commandesPayees.reduce((s, c) => s + c.total, 0)

  const ventesParProduit = {}
  for (const c of commandesPayees) {
    for (const a of c.commande_articles || []) {
      ventesParProduit[a.nom_produit] = (ventesParProduit[a.nom_produit] || 0) + a.quantite
    }
  }
  const topProduits = Object.entries(ventesParProduit).sort((a, b) => b[1] - a[1]).slice(0, 5)

  if (commandes.length === 0) return <p style={{ color: 'var(--fumee)' }}>Aucune commande pour le moment.</p>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="carte" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--fumee)' }}>Chiffre d'affaires</p>
          <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--emeraude-clair)' }}>{chiffreAffaires.toFixed(2)} €</p>
        </div>
        <div className="carte" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--fumee)' }}>Commandes payées</p>
          <p style={{ fontSize: 22, fontFamily: 'var(--font-display)' }}>{commandesPayees.length}</p>
        </div>
        <div className="carte" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--fumee)' }}>Panier moyen</p>
          <p style={{ fontSize: 22, fontFamily: 'var(--font-display)' }}>
            {commandesPayees.length > 0 ? (chiffreAffaires / commandesPayees.length).toFixed(2) : '0.00'} €
          </p>
        </div>
      </div>

      {topProduits.length > 0 && (
        <div className="carte" style={{ padding: 18, marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Meilleures ventes</p>
          {topProduits.map(([nom, qte]) => (
            <div key={nom} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--cire-douce)' }}>{nom}</span>
              <span style={{ color: 'var(--flamme)' }}>{qte} vendues</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary" style={{ marginBottom: 20 }} onClick={exporterCSV}>
        ⬇️ Exporter les commandes (CSV)
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {commandes.map(c => (
        <div key={c.id} className="carte" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--fumee)' }}>
              {new Date(c.created_at).toLocaleDateString('fr-FR')} · {c.mode_livraison === 'drive_fampoux' ? 'Retrait Fampoux' : 'Livraison'}
              {c.code_promo && <> · code {c.code_promo}</>}
            </span>
            <select
              value={c.statut} onChange={e => changerStatut(c.id, e.target.value)}
              style={{ background: 'var(--bois)', color: 'var(--cire)', border: '1px solid var(--bois-clair)', borderRadius: 4, padding: '4px 8px' }}
            >
              {STATUTS.map(s => <option key={s} value={s}>{LIBELLES_STATUT[s]}</option>)}
            </select>
          </div>
          {c.adresse_livraison && (
            <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 8 }}>{c.adresse_livraison}, {c.code_postal_livraison} {c.ville_livraison}</p>
          )}
          <div style={{ fontSize: 14, color: 'var(--cire-douce)', marginBottom: 10 }}>
            {c.commande_articles?.map(a => <div key={a.id}>{a.quantite} × {a.nom_produit}</div>)}
          </div>
          <div style={{ fontWeight: 600, borderTop: '1px solid var(--bois-clair)', paddingTop: 10 }}>Total : {c.total.toFixed(2)} €</div>
        </div>
      ))}
      </div>
    </div>
  )
}
