# Lueur & Cire — Guide de mise en ligne

Ton site est codé et prêt. Il reste 4 étapes pour qu'il soit en ligne et accepte de vrais paiements.

## Étape 1 — Mettre le code sur GitHub

1. Crée un compte sur https://github.com si t'en as pas
2. Crée un nouveau repository (bouton vert "New"), nom : `bougie-shop`, laisse-le en **Private**
3. Sur ton ordi, dans le dossier du projet, lance :
```
git init
git add .
git commit -m "Premier commit"
git remote add origin https://github.com/TON_PSEUDO/bougie-shop.git
git push -u origin main
```

## Étape 2 — Connecter Netlify à GitHub

1. Va sur https://netlify.com → "Add new site" → "Import an existing project"
2. Choisis GitHub, autorise l'accès, sélectionne `bougie-shop`
3. Netlify détecte automatiquement les réglages (build: `npm run build`, dossier: `dist`) — laisse tel quel
4. **Ne clique pas encore sur "Deploy"** — va d'abord à l'étape 3

## Étape 3 — Ajouter les variables d'environnement dans Netlify

Dans Netlify : **Site settings → Environment variables → Add a variable**. Ajoute chacune :

| Nom | Valeur | Où la trouver |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://owmwlshgagyqzyxrlehe.supabase.co` | déjà connue |
| `VITE_SUPABASE_ANON_KEY` | ta clé `sb_publishable_...` | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY` | ta clé `sk_test_...` | Stripe → Developers → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | clé secrète Supabase | Supabase → Project Settings → API keys (⚠️ jamais dans le code, seulement ici) |
| `SITE_URL` | l'URL que Netlify t'aura donnée (ex: `https://lueur-et-cire.netlify.app`) | après le 1er déploiement |

Clique ensuite sur **Deploy site**.

## Étape 4 — Configurer le webhook Stripe

Le webhook permet à Stripe de dire à ton site "le paiement a réussi" pour passer la commande en statut "payée".

1. Sur Stripe (toujours en mode Test) → **Developers → Webhooks → Add endpoint**
2. URL à renseigner : `https://TON-SITE.netlify.app/.netlify/functions/stripe-webhook`
3. Événement à écouter : `checkout.session.completed`
4. Une fois créé, Stripe te donne un `Signing secret` (commence par `whsec_...`)
5. Retourne dans Netlify → Environment variables → ajoute `STRIPE_WEBHOOK_SECRET` avec cette valeur
6. Redéploie le site (Netlify → Deploys → Trigger deploy)

## Étape 5 — Te donner les droits admin

1. Va sur ton site en ligne, crée un compte client avec TON email (bouton "Connexion" → "Créer un compte")
2. Reviens me voir dans le chat, dis-moi "j'ai créé mon compte avec [ton email]" et je passerai ton compte en admin directement dans la base de données.

## Passer en vrai paiement (mode Live)

Quand tu es prêt à encaisser du vrai argent :
1. Stripe → complète ton profil business (Settings → Business details : SIRET si tu as un statut auto-entrepreneur, RIB, etc.)
2. Bascule le toggle "Test mode" → "Live mode" dans Stripe
3. Récupère les nouvelles clés `pk_live_...` / `sk_live_...`
4. Remplace-les dans Netlify (variables d'environnement)
5. Recrée le webhook en mode Live (étape 4, mais avec le toggle Live activé)

## Notes importantes

- **Ne mets jamais** `sk_...` (Stripe) ou la `service_role key` (Supabase) directement dans le code du site — uniquement dans les variables d'environnement Netlify. C'est déjà comme ça que le projet est structuré.
- Le panier est sauvegardé dans le navigateur du client (il ne se vide pas s'il ferme l'onglet).
- Chaque bougie que tu ajoutes dans l'espace `/admin` apparaît automatiquement dans la boutique si "Visible dans la boutique" est coché.
