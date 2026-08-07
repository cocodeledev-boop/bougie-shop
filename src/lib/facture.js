import { jsPDF } from 'jspdf'

// Genere une facture PDF simple pour une commande, telechargee directement dans le navigateur
export function genererFacturePDF(commande, nomBoutique) {
  const doc = new jsPDF()
  const marge = 20
  let y = 25

  doc.setFontSize(20)
  doc.text(nomBoutique || 'Hugoline & Compagnies', marge, y)
  y += 10
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text('Facture', marge, y)
  y += 6
  doc.text(`Commande n° ${commande.id.slice(0, 8).toUpperCase()}`, marge, y)
  y += 6
  doc.text(`Date : ${new Date(commande.created_at).toLocaleDateString('fr-FR')}`, marge, y)
  y += 14

  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text('Articles', marge, y)
  y += 8
  doc.setFontSize(10)

  for (const article of commande.commande_articles || []) {
    const ligneTotal = (article.prix_unitaire * article.quantite).toFixed(2)
    doc.text(`${article.quantite} x ${article.nom_produit}`, marge, y)
    doc.text(`${ligneTotal} EUR`, 170, y, { align: 'right' })
    y += 7
  }

  y += 4
  doc.setDrawColor(200)
  doc.line(marge, y, 190, y)
  y += 10

  if (commande.reduction_montant > 0) {
    doc.text(`Réduction${commande.code_promo ? ` (${commande.code_promo})` : ''}`, marge, y)
    doc.text(`-${commande.reduction_montant.toFixed(2)} EUR`, 170, y, { align: 'right' })
    y += 8
  }

  doc.setFontSize(13)
  doc.text('Total payé', marge, y)
  doc.text(`${commande.total.toFixed(2)} EUR`, 170, y, { align: 'right' })
  y += 14

  doc.setFontSize(9)
  doc.setTextColor(140)
  doc.text(
    commande.mode_livraison === 'drive_fampoux'
      ? 'Retrait en main propre — Fampoux (62)'
      : `Livraison : ${commande.adresse_livraison || ''}, ${commande.code_postal_livraison || ''} ${commande.ville_livraison || ''}`,
    marge, y
  )

  doc.save(`facture-${commande.id.slice(0, 8)}.pdf`)
}
