import { jsPDF } from 'jspdf'

// Couleurs de marque (converties depuis index.css) pour une facture visuellement cohérente
const NUIT = [28, 20, 15]
const BRAISE = [201, 98, 43]
const FUMEE = [110, 100, 92]
const CIRE_DOUCE = [80, 68, 55]
const LIGNE = [225, 216, 200]

// Genere une facture PDF professionnelle pour une commande, avec toutes les mentions
// legales obligatoires (SIRET, statut auto-entrepreneur, TVA non applicable).
// parametres : objet issu de useParametres() (nom_boutique, siret, mentions_legales...)
// client : { prenom, nom, email } du compte connecte
export function genererFacturePDF(commande, parametres = {}, client = {}) {
  const doc = new jsPDF()
  const margeG = 20
  const margeD = 190
  const nomBoutique = parametres.nom_boutique || 'Hugoline & Compagnies'
  let y = 22

  // --- En-tete : nom de la marque + bandeau "FACTURE" ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...NUIT)
  doc.text(nomBoutique, margeG, y)

  doc.setFontSize(16)
  doc.setTextColor(...BRAISE)
  doc.text('FACTURE', margeD, y, { align: 'right' })

  y += 6
  doc.setDrawColor(...BRAISE)
  doc.setLineWidth(0.8)
  doc.line(margeG, y, margeD, y)
  y += 10

  // --- Bloc vendeur (obligatoire : SIRET, statut, adresse) ---
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...FUMEE)
  const infosVendeur = [
    'Entreprise individuelle (auto-entrepreneur)',
    parametres.siret ? `SIRET : ${parametres.siret}` : null,
    'TVA non applicable, art. 293 B du CGI',
    parametres.email_contact || 'hugoline.compagnies@orange.fr',
  ].filter(Boolean)
  for (const ligne of infosVendeur) {
    doc.text(ligne, margeG, y)
    y += 5
  }

  // --- Bloc facture (numero, date) aligne a droite, sur la meme zone verticale ---
  let yDroite = y - infosVendeur.length * 5
  doc.setTextColor(...CIRE_DOUCE)
  doc.text(`Facture n° ${commande.id.slice(0, 8).toUpperCase()}`, margeD, yDroite, { align: 'right' })
  yDroite += 5
  doc.text(`Date : ${new Date(commande.created_at).toLocaleDateString('fr-FR')}`, margeD, yDroite, { align: 'right' })
  yDroite += 5
  doc.text(`Commande : ${new Date(commande.created_at).toLocaleDateString('fr-FR')}`, margeD, yDroite, { align: 'right' })

  y += 8

  // --- Bloc client ---
  const nomClient = [client.prenom, client.nom].filter(Boolean).join(' ')
  if (nomClient || client.email) {
    doc.setFillColor(247, 244, 237)
    doc.roundedRect(margeG, y, margeD - margeG, 20, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...FUMEE)
    doc.text('FACTURÉ À', margeG + 6, y + 7)
    doc.setFontSize(10)
    doc.setTextColor(...NUIT)
    doc.setFont('helvetica', 'bold')
    doc.text(nomClient || 'Client', margeG + 6, y + 14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...FUMEE)
    doc.setFontSize(9)
    if (client.email) doc.text(client.email, margeG + 6, y + 18.5)
    y += 28
  } else {
    y += 6
  }

  // --- Tableau des articles ---
  doc.setFillColor(...NUIT)
  doc.rect(margeG, y, margeD - margeG, 9, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('ARTICLE', margeG + 4, y + 6)
  doc.text('QTÉ', 140, y + 6, { align: 'center' })
  doc.text('TOTAL', margeD - 4, y + 6, { align: 'right' })
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  let ligneAlternee = false
  for (const article of commande.commande_articles || []) {
    const hauteurLigne = 9
    if (ligneAlternee) {
      doc.setFillColor(250, 248, 244)
      doc.rect(margeG, y, margeD - margeG, hauteurLigne, 'F')
    }
    ligneAlternee = !ligneAlternee

    const ligneTotal = (article.prix_unitaire * article.quantite).toFixed(2)
    doc.setTextColor(...NUIT)
    doc.text(article.nom_produit, margeG + 4, y + 6)
    doc.setTextColor(...FUMEE)
    doc.text(String(article.quantite), 140, y + 6, { align: 'center' })
    doc.setTextColor(...NUIT)
    doc.text(`${ligneTotal} €`, margeD - 4, y + 6, { align: 'right' })
    y += hauteurLigne
  }

  doc.setDrawColor(...LIGNE)
  doc.setLineWidth(0.3)
  doc.line(margeG, y, margeD, y)
  y += 9

  // --- Sous-totaux ---
  doc.setFontSize(9.5)
  doc.setTextColor(...FUMEE)

  const sousTotal = (commande.commande_articles || []).reduce((s, a) => s + a.prix_unitaire * a.quantite, 0)
  doc.text('Sous-total', 140, y, { align: 'right' })
  doc.setTextColor(...NUIT)
  doc.text(`${sousTotal.toFixed(2)} €`, margeD, y, { align: 'right' })
  y += 6.5

  if (commande.frais_livraison > 0) {
    doc.setTextColor(...FUMEE)
    doc.text('Livraison', 140, y, { align: 'right' })
    doc.setTextColor(...NUIT)
    doc.text(`${commande.frais_livraison.toFixed(2)} €`, margeD, y, { align: 'right' })
    y += 6.5
  }

  if (commande.reduction_montant > 0) {
    doc.setTextColor(...BRAISE)
    doc.text(`Réduction${commande.code_promo ? ` (${commande.code_promo})` : ''}`, 140, y, { align: 'right' })
    doc.text(`-${commande.reduction_montant.toFixed(2)} €`, margeD, y, { align: 'right' })
    y += 6.5
  }

  y += 3
  doc.setFillColor(...NUIT)
  doc.roundedRect(110, y, margeD - 110, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL PAYÉ', 115, y + 8)
  doc.text(`${commande.total.toFixed(2)} €`, margeD - 4, y + 8, { align: 'right' })
  y += 22

  // --- Livraison ---
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...FUMEE)
  doc.text('MODE DE RÉCEPTION', margeG, y)
  y += 5.5
  doc.setTextColor(...NUIT)
  doc.text(
    commande.mode_livraison === 'drive_fampoux'
      ? 'Retrait en main propre — Fampoux (62)'
      : commande.mode_livraison === 'point_relais'
        ? `Point relais : ${commande.point_relais || ''}`
        : `Livraison à domicile : ${commande.adresse_livraison || ''}, ${commande.code_postal_livraison || ''} ${commande.ville_livraison || ''}`,
    margeG, y
  )

  // --- Pied de page legal ---
  const yPied = 275
  doc.setDrawColor(...LIGNE)
  doc.setLineWidth(0.3)
  doc.line(margeG, yPied - 8, margeD, yPied - 8)
  doc.setFontSize(7.5)
  doc.setTextColor(...FUMEE)
  doc.text(
    `${nomBoutique} — Entreprise individuelle${parametres.siret ? ` — SIRET ${parametres.siret}` : ''} — TVA non applicable, art. 293 B du CGI`,
    margeG, yPied
  )
  doc.text('En cas de litige, une réclamation peut être adressée au vendeur avant tout recours.', margeG, yPied + 4)

  doc.save(`facture-${nomBoutique.replace(/[^a-zA-Z0-9]/g, '-')}-${commande.id.slice(0, 8)}.pdf`)
}
