// Redimensionne et compresse une image cote client avant upload,
// pour que le site reste rapide meme avec beaucoup de photos.
export function compresserImage(fichier, tailleMax = 1200, qualite = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const lecteur = new FileReader()

    lecteur.onload = () => { image.src = lecteur.result }
    lecteur.onerror = reject
    lecteur.readAsDataURL(fichier)

    image.onload = () => {
      let { width, height } = image
      if (width > tailleMax || height > tailleMax) {
        if (width > height) {
          height = Math.round((height * tailleMax) / width)
          width = tailleMax
        } else {
          width = Math.round((width * tailleMax) / height)
          height = tailleMax
        }
      }
      const canevas = document.createElement('canvas')
      canevas.width = width
      canevas.height = height
      const ctx = canevas.getContext('2d')
      ctx.drawImage(image, 0, 0, width, height)
      canevas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Compression échouée')); return }
          resolve(new File([blob], fichier.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        qualite
      )
    }
    image.onerror = reject
  })
}
