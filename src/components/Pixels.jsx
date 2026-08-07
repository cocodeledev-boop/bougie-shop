import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useParametres } from '../hooks/useParametres'
import { supabase } from '../lib/supabase'

// Insere les scripts de tracking Meta (Facebook/Instagram) et TikTok
// uniquement si les IDs ont ete renseignes dans l'admin -> Reglages.
export default function Pixels() {
  const { parametres } = useParametres()
  const location = useLocation()

  // Enregistre une visite (page + visiteur unique via session) dans Supabase
  // a chaque changement de page, pour le compteur affiche dans Admin -> Reglages.
  useEffect(() => {
    let idVisiteur = localStorage.getItem('id_visiteur')
    if (!idVisiteur) {
      idVisiteur = crypto.randomUUID()
      localStorage.setItem('id_visiteur', idVisiteur)
    }
    supabase.from('vues_pages').insert({
      page: location.pathname,
      id_visiteur: idVisiteur,
    }).then()
  }, [location.pathname])

  useEffect(() => {
    if (parametres.meta_pixel_id && !document.getElementById('pixel-meta')) {
      const script = document.createElement('script')
      script.id = 'pixel-meta'
      script.innerHTML = `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${parametres.meta_pixel_id}');
        fbq('track', 'PageView');
      `
      document.head.appendChild(script)
    }

    if (parametres.tiktok_pixel_id && !document.getElementById('pixel-tiktok')) {
      const script = document.createElement('script')
      script.id = 'pixel-tiktok'
      script.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.length;n++)ttq.setAndDefer(e,e[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${parametres.tiktok_pixel_id}');
          ttq.page();
        }(window, document, 'ttq');
      `
      document.head.appendChild(script)
    }
  }, [parametres.meta_pixel_id, parametres.tiktok_pixel_id])

  return null
}
