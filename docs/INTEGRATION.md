# Intégration — Générateur de PDF

Application React + petit backend Node/Express pour concevoir des gabarits de documents
(factures, devis, bons de commande…) et les imprimer en PDF via le navigateur.

Ce document explique comment **lancer** le projet et comment **toute application externe**
(autre site, outil métier, API tierce…) peut rediriger ses utilisateurs vers la page
d'impression avec ses propres données.

---

## 1. Lancement

Prérequis : Node.js 20+.

### Développement

```bash
npm install
npm run dev
```

- Interface : http://localhost:5173
- API : http://localhost:3001 (le front redirige `/api` vers le serveur)

### Production

```bash
npm run build   # génère le dossier dist/
npm start       # Express sert l'interface + l'API sur http://localhost:3001
```

---

## 2. Architecture

| Élément | Rôle |
|---|---|
| `src/` | Front React (routes : `/` accueil, `/edit/:id` éditeur, `/print` impression) |
| `server/index.js` | API Express + sert le build de production |
| `server/data/templates.json` | Gabarits enregistrés côté serveur (créé automatiquement) |
| `localStorage` | Gabarits enregistrés côté navigateur (toujours actifs) |

La vue `/print` est le point d'entrée de l'impression : elle charge un gabarit,
applique les données reçues, affiche le document et permet d'enregistrer/imprimer en PDF.

---

## 3. API

Toutes les routes sont préfixées `/api`. L'API est **absolue** : elle est accessible sur
`<ORIGINE>/api/...`, où `<ORIGINE>` est l'origine de l'application (en production,
`https://gesteg-doc.vercel.app`). Pour appeler l'API depuis une autre application, utilisez
toujours l'URL complète — jamais une URL relative (elle serait résolue vers votre propre
domaine).

| Méthode | Route | Description |
|---|---|---|
| `GET` | `<ORIGINE>/api/templates` | Liste tous les gabarits enregistrés côté serveur |
| `GET` | `<ORIGINE>/api/templates/:id` | Récupère un gabarit |
| `PUT` | `<ORIGINE>/api/templates/:id` | Enregistre (crée ou écrase) un gabarit |
| `DELETE` | `<ORIGINE>/api/templates/:id` | Supprime un gabarit |
| `POST` | `<ORIGINE>/api/print` | Construit l'URL d'impression (redirection 302) |

### POST /api/print

Corps JSON :

```json
{
  "templateId": "facture",
  "data": { "facture": { "numero": "FAC-2027-001" } },
  "autoprint": true
}
```

| Champ | Obligatoire | Description |
|---|---|---|
| `templateId` | oui (sauf si `template`) | Id d'un gabarit enregistré sur le serveur |
| `template` | non | Gabarit complet fourni directement (aucun enregistrement requis) |
| `data` | non | Données à injecter dans le document |
| `autoprint` | non | `true` = l'impression se déclenche automatiquement |

Réponse :

- Par défaut : **302** vers `/print?template=<id>&data=<encodé>[&autoprint=1]`
- Avec `?redirect=false` : **200** `{ "url": "/print?template=<id>&data=<encodé>" }`

---

## 4. URL d'impression (format)

### Trois méthodes d'intégration

Il y a **trois manières** d'envoyer un utilisateur sur la page d'impression :

| | **Embarqué (`tpl=`)** | **Enregistré (`template=`)** | **API** |
|---|---|---|---|
| **Qui l'utilise** | Lien/bouton (navigateur) | Lien/bouton (navigateur) | Votre serveur (appel HTTP `fetch`) |
| **Serveur requis** | Non | Oui (gabarit enregistré) | Oui |
| **Résultat** | Page d'impression ouverte | Page d'impression ouverte | Redirection 302 (ou URL en JSON) à suivre |
| **Taille de l'URL** | Longue (limite à respecter) | Courte | Toujours courte (données hors URL) |
| **Usage typique** | Démo, gabarit non enregistré | La plupart des cas | Backend qui construit l'URL d'impression |

**En clair** :
- L'**URL directe** (embarquée `tpl=` ou enregistrée `template=`) envoie l'utilisateur sur la
  page d'impression avec un **simple lien**. Rien à appeler : tout est dans l'URL. C'est le
  cas le plus fréquent.
- L'**API** sert à **construire l'URL depuis votre serveur** : vous l'appelez, elle vous
  répond par une redirection vers la page d'impression. Les données restent côté serveur,
  l'URL finale reste courte (pas de limite de taille d'URL).

**Recommandation** : dans la majorité des cas, utilisez la forme **enregistrée**
(`?template=<id>`) en **mode simple utilisateur** (`&toolbar=0`). Passez à l'**API** si vous
construisez l'URL côté serveur ou si l'URL devient trop longue. Réservez `tpl=` aux gabarits
simples.

Les URL d'intégration doivent être **absolues**, préfixées par l'origine de l'application
(`https://gesteg-doc.vercel.app` en production) :

```
https://gesteg-doc.vercel.app/print?template=<id>&data=<base64url JSON>&toolbar=0
```

| Paramètre | Description |
|---|---|
| `template` | Id du gabarit (serveur ou localStorage du navigateur) |
| `tpl` | **Alternative autosuffisante** : gabarit complet encodé en base64url — fonctionne sans serveur |
| `data` | Données du document encodées en base64url (JSON) |
| `toolbar` | `0` = **mode simple utilisateur** (masque Modifier / Accueil / Aide) — idéal pour un client qui vient juste imprimer |
| `autoprint` | **Optionnel** : `1` = ouvre la boîte d'impression automatiquement au chargement (à n'utiliser que si nécessaire, sinon elle s'ouvre à chaque rechargement) |

> La vue `/print` accepte à la fois le **base64url** (`-_`) et le **base64** classique (`+/=`) pour `data` et `tpl`.
>
> Préfixez toujours ces URL par l'origine (`window.location.origin` côté navigateur) :
> sans préfixe, `/print?...` serait résolu vers le domaine de l'application **consommatrice**
> et ne pointerait pas vers cette application.

### Encodage des données (JavaScript)

```js
function encodeB64Url(obj) {
  const json = JSON.stringify(obj)
  const b64 = btoa(unescape(encodeURIComponent(json))) // gère les accents / UTF-8
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
```

Exemple :

```js
const ORIGINE = 'https://gesteg-doc.vercel.app'
const data = encodeB64Url({ facture: { numero: 'FAC-2027-001', client: 'Jean Dupont' } })
const url = `${ORIGINE}/print?template=facture&data=${data}&toolbar=0`
```

---

## 5. Exemples d'appel depuis une application externe

> Dans tous les exemples, `ORIGINE` est l'origine de cette application, ex.
> `const ORIGINE = 'https://gesteg-doc.vercel.app'` (côté navigateur :
> `window.location.origin` si l'intégration vit sur le même domaine).

### Scénario A — redirection via l'API (recommandé)

```js
const ORIGINE = 'https://gesteg-doc.vercel.app'
const res = await fetch(`${ORIGINE}/api/print`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'facture',
    data: { facture: { numero: 'FAC-2027-001' }, lignes: [...] },
    toolbar: false, // mode simple utilisateur : sans les boutons Modifier / Accueil / Aide
    // autoprint: true, // optionnel : boîte d'impression automatique
  }),
  redirect: 'manual',
})
// La redirection 302 pointe vers `${ORIGINE}/print?template=facture&data=...&toolbar=0`
const url = new URL(res.headers.get('location'), ORIGINE)
window.location.href = url.href
```

### Scénario B — URL directe (le navigateur de l'utilisateur ouvre la page)

```js
const ORIGINE = 'https://gesteg-doc.vercel.app'
const data = encodeB64Url({ facture: { numero: 'FAC-2027-001' } })
window.open(`${ORIGINE}/print?template=facture&data=${data}&toolbar=0`, '_blank')
```

### Scénario C — gabarit embarqué (aucun gabarit pré-enregistré)

```js
const ORIGINE = 'https://gesteg-doc.vercel.app'
const tpl = encodeB64Url(gabaritCompletJson) // ex : exporté depuis l'éditeur (bouton Exporter)
const data = encodeB64Url({ facture: { numero: 'FAC-2027-001' } })
window.open(`${ORIGINE}/print?tpl=${tpl}&data=${data}&toolbar=0`, '_blank')
```

> Depuis l'interface, le bouton **Partager** d'un gabarit génère ces URLs (portable + serveur)
> avec un bouton « Copier » et un interrupteur **mode simple utilisateur / professionnel**
> (ajoute `&toolbar=0`).

---

## 6. Données du document

Les champs sont référencés dans l'éditeur par des **chemins** (points) dans l'objet JSON
de l'onglet **Données**. Exemple du gabarit « Facture » :

```json
{
  "entreprise": { "nom": "...", "adresse": "...", "email": "...", "siret": "..." },
  "facture": { "numero": "...", "date": "...", "echeance": "...", "client": "...",
               "totalHT": "...", "tva": "...", "totalTTC": "..." },
  "lignes": [ { "designation": "...", "quantite": "...", "prix": "...", "total": "..." } ]
}
```

- Un **champ lié** à `facture.numero` affichera la valeur correspondante.
- Un **tableau** dont la source est `lignes` itérera sur le tableau.
- Dans les textes, `{{facture.client}}` est remplacé par la valeur.

---

## 7. Bonnes pratiques

- **URLs trop longues** : une image de fond volumineuse (base64) peut rendre l'URL
  gigantesque. Privilégiez alors l'URL `?template=<id>` (gabarit enregistré) plutôt que `?tpl=…`.
- **Impression automatique** : certains navigateurs / bloqueurs d'annonces peuvent bloquer
  `window.print()`. Prévoyez toujours le bouton « Imprimer / PDF » en secours (il est présent).
- **CORS** : inutile si l'application consommatrice appelle le serveur du même domaine
  (ou via proxy). Sinon, ajoutez le middleware `cors()` dans `server/index.js`.
- **Accents / UTF-8** : utilisez toujours `unescape(encodeURIComponent(json))` avant `btoa`
  pour éviter les erreurs de décodage.
