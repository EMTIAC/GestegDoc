# Générateur de PDF

Application React + backend Node/Express pour **concevoir des gabarits de documents**
(factures, devis, bons de commande, attestations…) et les **imprimer / exporter en PDF**
via le navigateur.

Le tout est **configurable sans code** : les documents sont décrits par un gabarit
(mise en page + données) éditable visuellement, que l'on peut partager, exporter, importer
et réutiliser, y compris depuis d'autres applications via une simple URL ou une petite API.

---

## Sommaire

1. [Fonctionnalités](#1-fonctionnalités)
2. [Installation et lancement](#2-installation-et-lancement)
3. [Utilisation de l'interface](#3-utilisation-de-linterface)
   - [Accueil](#31-accueil)
   - [Éditeur](#32-éditeur)
   - [Éléments et mise en page](#33-éléments-et-mise-en-page)
   - [Données](#34-données)
   - [Pages et formats](#35-pages-et-formats)
   - [Fond et filigrane](#36-fond-et-filigrane)
   - [Impression](#37-impression)
   - [Partage, export et import](#38-partage-export-et-import)
4. [Format d'un gabarit (JSON)](#4-format-dun-gabarit-json)
5. [API](#5-api)
6. [URL d'impression](#6-url-dimpression)
7. [Architecture et fichiers](#7-architecture-et-fichiers)
8. [Dépannage](#8-dépannage)
9. [Stockage des données et déploiement (Vercel)](#9-stockage-des-données-et-déploiement-vercel)
10. [Documentation complémentaire](#10-documentation-complémentaire)

---

## 1. Fonctionnalités

- **Éditeur visuel WYSIWYG** : la page affiche exactement ce qui sera imprimé.
- **Glisser-déposer** d'éléments depuis une palette (titre, texte, champ lié, tableau,
  bloc, image, séparateur, espace).
- **Mise en page flexible** : chaque élément peut occuper 100 %, 1/2, 1/3, 2/3, 1/4 ou 3/4
  de la largeur → éléments côte à côte.
- **Mise en page libre (type Figma)** : positionnement absolu à la souris par page,
  avec aimantation, guides d'alignement, redimensionnement par poignées et coordonnées
  en millimètres modifiables dans le panneau Propriétés.
- **Blocs (conteneurs)** : regrouper des éléments côte à côte ou imbriqués, avec fond,
  bordure, marge intérieure ; **répétables** sur un tableau de données (cartes, fiches,
  étiquettes…).
- **Image** : par URL ou import local, avec dimensions, ajustement (remplir / contenir /
  étirer) et rayon.
- **Multi-pages** : ajouter, supprimer et réordonner les pages d'un document.
- **Multi-gabarits** : création, duplication, import/export, partage.
- **Champs liés aux données** : les valeurs sont injectées par chemins (`facture.numero`,
  `lignes` pour les tableaux).
- **Formats variés** : A0→A8, B4/B5/B6, enveloppes C4/C5/C6, formats américains
  (Letter, Legal, Tabloïd, Executive, Demi-lettre), ou **personnalisé** (mm), portrait/paysage, marges.
- **Fond de page** : couleur, image (upload) ou **filigrane** texte, page par page.
- **Téléchargement PDF direct** : génère le fichier PDF fidèle à la conception
  (format, orientation, marges, fond, mise en page) sans dépendre des réglages du navigateur.
- **Impression** : via la boîte de dialogue du navigateur (papier), en complément.
- **Partage** : génération d'une URL d'impression par gabarit, utilisable par n'importe
  quelle application.
- **Guide téléchargeable** : pour chaque gabarit, un fichier Markdown récapitule la mise
  en page, les données attendues (JSON d'exemple), tous les champs utilisés par les
  éléments, et les modes d'impression / intégration (URL et API).
- **Backend** : API pour gérer les gabarits et générer les URL d'impression, sert aussi
  l'interface en production.
- **Stockage & comptes** : API Express (auth, gabarits, URL d'impression), gabarits
  rattachés à chaque compte, synchronisés sur Redis Upstash (voir [section 9](#9-stockage-des-données-et-déploiement-vercel)).

---

## 2. Installation et lancement

Prérequis : **Node.js 20+**.

```bash
npm install
```

### Développement

```bash
npm run dev
```

- Interface : http://localhost:5173
- API : http://localhost:3001 (le front redirige `/api` vers le serveur)

### Production

```bash
npm run build   # génère le dossier dist/
npm start       # Express sert l'interface + l'API sur http://localhost:3001
```

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run dev:client` | Uniquement le front Vite |
| `npm run dev:server` | Uniquement le serveur API |
| `npm run lint` | Analyse statique (oxlint) |
| `npm run preview` | Prévisualise le build sans serveur API |

---

## 3. Utilisation de l'interface

### 3.1 Accueil

Page `/` : liste des gabarits enregistrés. Pour chacun : **Modifier**, **Imprimer**,
**Partager**, **Exporter**, **Guide**, **Dupliquer**, **Supprimer**. Boutons pour créer un
document vierge, une facture d'exemple, ou importer un gabarit depuis un fichier.

### 3.2 Éditeur

Page `/edit/:id`. Organisation en trois colonnes :

- **Gauche — Palette** : éléments à glisser dans la page (ou à cliquer pour ajouter).
- **Centre — Page** : bandeau de pages, réglages de zoom, et la page en cours de
  composition (rendu fidèle).
- **Droite — Panneaux** : onglets *Propriétés*, *Données*, *Page*, *Fond*.

La barre du haut contient : nom du gabarit, **Guide**, **Partager**, **Aperçu**,
**Imprimer / PDF**, **Exporter**, **Importer**, la **synchronisation** (mode Auto ou
Ctrl+S + indicateur « non enregistré »), **Réinitialiser**, et le **bouton de connexion**.

**Raccourcis clavier** (élément sélectionné) :

| Raccourci | Action |
|---|---|
| `Ctrl` / `Cmd` + `C` | Copier l'élément sélectionné |
| `Ctrl` / `Cmd` + `X` | Couper l'élément sélectionné |
| `Ctrl` / `Cmd` + `V` | Coller (juste après la sélection en mode Flux, en surimpression décalée en mode Libre) |
| `Ctrl` / `Cmd` + `D` | Dupliquer l'élément sélectionné |
| `Ctrl` / `Cmd` + `Z` | Annuler la dernière action |
| `Ctrl` / `Cmd` + `Shift` + `Z` ou `Ctrl` / `Cmd` + `Y` | Rétablir |
| `Suppr` / `Backspace` | Supprimer l'élément sélectionné |

L'annulation fonctionne sur toutes les modifications (édition, déplacement,
redimensionnement, pages, données, fond…). Un glisser-déposer ou un redimensionnement
complet ne compte que pour une seule étape d'annulation.

### 3.3 Éléments et mise en page

| Élément | Rôle |
|---|---|
| **Titre** | Grand texte de titre |
| **Texte** | Paragraphe (supporte `{{chemin}}`) |
| **Champ lié** | Libellé + valeur issue des données (`facture.numero`) |
| **Tableau** | Table dynamique alimentée par un tableau de données (`lignes`) |
| **Bloc** | Conteneur : y déposer des éléments, côte à côte ou imbriqués ; répétable sur des données |
| **Image** | Image par URL ou upload local, avec dimensions, ajustement (remplir / contenir / étirer) et rayon |
| **Séparateur** | Trait horizontal |
| **Espace** | Blanc vertical réglable |
| **Saut de page** | Non utilisé : préférez une nouvelle page |

**Sélectionner** un élément : cliquer dessus (le contour devient bleu et une barre
d'actions apparaît au survol : ↑ ↓ dupliquer supprimer). La barre reste affichée une
seconde après que la souris quitte l'élément, le temps de l'atteindre. **Réordonner** :
glisser un élément sur un autre ou dans la page.
**Largeur** : dans l'onglet Propriétés, choisir 100 %, 1/2, 1/3, 2/3, 1/4 ou 3/4 pour
placer plusieurs éléments côte à côte.

**Blocs (conteneurs)** :
- Ajoutez un **Bloc**, réglez sa largeur (ex. 1/2), puis glissez des éléments dedans
  (dans la zone « Déposez des éléments ») ou cliquez sur sa zone inférieure « ＋ ».
- Les blocs se placent côte à côte selon leur largeur et peuvent être **imbriqués**.
- **Répétition** : dans les propriétés d'un bloc, renseignez une **Source des données**
  (ex. `clients`). Le bloc est alors répété pour chaque ligne, ses champs lus dans chaque
  ligne (ex. champ `nom` → `clients[0].nom`). Idéal pour des cartes, fiches, étiquettes.
- Propriétés : marge intérieure, espacement interne, hauteur minimale, fond
  (transparent possible), bordure, rayon.

### 3.4 Données

Onglet **Données** : un JSON détermine les valeurs injectées dans le document.
Les champs utilisent des chemins avec des points :

```json
{
  "entreprise": { "nom": "Ma Société", "siret": "123..." },
  "facture": { "numero": "FAC-2026-001", "client": "Jean Dupont", "totalTTC": "1 500,00 €" },
  "lignes": [
    { "designation": "Prestation", "quantite": "10", "prix": "120,00 €", "total": "1 200,00 €" }
  ]
}
```

- Un **champ lié** à `facture.numero` affiche la valeur correspondante.
- Un **tableau** dont la source est `lignes` répète ses colonnes pour chaque ligne.
- Dans un texte, `{{facture.client}}` est remplacé par la valeur.
- Dans l'**URL d'une image**, `{{facture.logo_url}}` est remplacé par la valeur
  (l'image se charge depuis l'URL issue des données).

Cliquer **Appliquer** pour valider.

### 3.5 Pages et formats

- **Bandeau de pages** : ajouter (`+ Page`), sélectionner, réordonner (◀ ▶) et supprimer
  les pages. Chaque page se compose indépendamment.
- Onglet **Page** : format (toutes séries + **Personnalisé** en mm), orientation
  (portrait/paysage) et marge. Le format s'applique à tout le document.
- **Mise en page** : deux modes par page — *Flux* (éléments placés les uns après les
  autres) et *Libre* (positionnement type Figma). En mode **Libre** : glisser pour déplacer,
  poignées pour redimensionner, guides roses + aimantation pour aligner sur le centre, les
  bords et les autres éléments ; coordonnées (X, Y, L, H en mm) éditables dans
  l'onglet *Propriétés* ; boutons ↑ ↓ pour changer l'ordre d'empilement.

### 3.6 Fond et filigrane

Onglet **Fond** (par page active) :

- **Aucun / Couleur unie / Image de fond** (upload, opacité, remplir ou ajuster).
- **Filigrane texte** : contenu, opacité, taille et inclinaison.

Tout ce qui est posé ici s'imprime dans le PDF.

### 3.7 Impression

- **Télécharger PDF** (page d'impression ou modale d'aperçu) : génère directement le
  fichier PDF en respectant le format, l'orientation, les marges, les fonds/filigranes et
  la mise en page prévus — sans dépendre des réglages du navigateur.
- **Imprimer / PDF** : ouvre la boîte de dialogue du navigateur (pour imprimer sur papier).
  Attention : selon les réglages du navigateur (marges, « ajuster à la page »), le rendu
  peut différer — privilégiez **Télécharger PDF** pour un fichier fidèle.

### 3.8 Partage, export et import

- **Partager** : génère deux URL d'impression (portable et serveur) avec bouton « Copier ».
  Voir la [section 6](#6-url-dimpression).
- **Exporter** : télécharge le gabarit en JSON.
- **Importer** : charge un gabarit depuis un fichier JSON.
- **Synchronisation** : une fois connecté, le gabarit est synchronisé sur le serveur
  (mode **Auto** : à chaque modification ; mode **Ctrl+S** : manuel, avec un indicateur
  « non enregistré » tant que la touche n'a pas été pressée). Les gabarits sont ensuite
  accessibles depuis n'importe quel appareil (voir [section 9](#9-stockage-des-données-et-déploiement-vercel)).

---

## 4. Format d'un gabarit (JSON)

```json
{
  "meta": { "id": "facture", "name": "Facture" },
  "page": { "size": "A4", "orientation": "portrait", "margin": 25, "customW": 210, "customH": 297 },
  "data": { "...": "données d'exemple" },
  "pages": [
    {
      "id": "page-1",
      "layout": "flow",
      "background": { "type": "none", "color": "#ffffff", "image": null, "opacity": 0.3, "size": "cover" },
      "watermark": { "text": "", "opacity": 0.1, "size": 60, "angle": -30 },
      "elements": [
        { "id": "el-1", "type": "field", "props": { "width": 50, "label": "N°", "field": "facture.numero", "size": 12, "bold": false, "color": "#111111", "labelColor": "#888888" } }
      ]
    }
  ]
}
```

Types d'éléments : `title`, `text`, `field`, `table`, `image`, `divider`, `spacer`,
`pageBreak`.

Champs communs : `width` (pourcentage). En mise en page **libre**, chaque élément porte
en plus un objet `layout` : `{ x, y, w, h }` en millimètres (position et taille dans la
zone utile de la page). L'import valide automatiquement la structure et migre les anciens
gabarits.

---

## 5. API

Routes préfixées `/api`. La liste, l'écriture et la suppression des gabarits nécessitent
une **connexion** (cookie de session) ; la **lecture par id** est publique (liens de
partage `/print`). Voir la [section 9](#9-stockage-des-données-et-déploiement-vercel).

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Connexion email/mot de passe → cookie de session |
| `POST` | `/api/auth/logout` | Déconnexion |
| `GET` | `/api/auth/me` | Utilisateur courant (ou `401`) |
| `GET` | `/api/templates` | Liste **de mes** gabarits (connexion requise) |
| `GET` | `/api/templates/:id` | Récupère un gabarit par id (public, liens partagés) |
| `PUT` | `/api/templates/:id` | Enregistre (crée ou écrase) un gabarit (connexion requise) |
| `DELETE` | `/api/templates/:id` | Supprime un gabarit (connexion requise) |
| `POST` | `/api/print` | Construit l'URL d'impression (redirection 302) |
| `GET` | `/api/health` | Diagnostic du backend (Redis, erreurs…) |

### POST /api/print

```json
{
  "templateId": "facture",
  "data": { "facture": { "numero": "FAC-2027-001" } },
  "autoprint": true
}
```

- `templateId` (ou `template` complet) : gabarit à imprimer.
- `data` : données injectées dans le document.
- `autoprint` : `true` pour déclencher l'impression automatiquement.
- `toolbar` : `false` pour le mode simple utilisateur (sans boutons Modifier / Accueil / Aide).
- `download` : `true` pour télécharger directement le PDF (au lieu d'ouvrir la page).
- `view` : `true` pour ouvrir le PDF dans le lecteur PDF natif du navigateur.

Réponse : **302** vers `/print?template=<id>&data=<encodé>[&autoprint=1]`, ou **200**
`{ "url": "..." }` avec `?redirect=false`.

---

## 6. URL d'impression

### Trois méthodes d'intégration

| | **Embarqué (`tpl=`)** | **Enregistré (`template=`)** | **API** |
|---|---|---|---|
| **Qui l'utilise** | Lien/bouton (navigateur) | Lien/bouton (navigateur) | Votre serveur (appel HTTP `fetch`) |
| **Serveur requis** | Non | Oui (gabarit enregistré) | Oui |
| **Résultat** | Page d'impression ouverte | Page d'impression ouverte | Redirection 302 (ou URL en JSON) à suivre |
| **Taille de l'URL** | Longue (limite à respecter) | Courte | Toujours courte (données hors URL) |
| **Usage typique** | Démo, gabarit non enregistré | La plupart des cas | Backend qui construit l'URL d'impression |

**En clair** : l'**URL directe** (embarquée ou enregistrée) envoie l'utilisateur sur la page
d'impression avec un simple lien ; l'**API** sert à construire cette URL depuis votre serveur
(les données restent côté serveur, l'URL finale est courte).

**Recommandation** : dans la majorité des cas, l'URL directe avec un gabarit enregistré
(`?template=<id>`), en **mode simple utilisateur** (`&toolbar=0`), suffit. Passez à l'API si
l'URL devient trop longue ou si vous devez construire l'URL côté serveur.

### URL directe

Les URL d'intégration sont **absolues** : elles commencent par l'origine de l'application
(`https://gesteg-doc.vercel.app` en production) — jamais par `/` seul, sinon elles seraient
résolues vers le domaine de l'application **consommatrice**.

```
https://gesteg-doc.vercel.app/print?template=<id>&data=<base64url JSON>&toolbar=0
```

| Paramètre | Description |
|---|---|
| `template` | Id du gabarit (serveur ou localStorage du navigateur) |
| `tpl` | **Alternative autosuffisante** : gabarit complet encodé en base64url, sans serveur (compressé automatiquement) |
| `data` | Données du document en base64url JSON |
| `toolbar` | `0` = **mode simple utilisateur** (masque Modifier / Accueil / Aide) — idéal pour un client qui vient juste imprimer |
| `autoprint` | **Optionnel** : `1` = ouvre la boîte d'impression automatiquement au chargement (à n'utiliser que si nécessaire, sinon elle s'ouvre à chaque rechargement) |
| `download` | **Optionnel** : `1` = **télécharge directement le PDF** dès l'ouverture du lien, sans passer par la page d'impression |
| `pdf` | **Optionnel** : `1` = ouvre le PDF dans le **lecteur PDF natif du navigateur** (outils Enregistrer / Télécharger / Imprimer) |

Base64url et base64 classique (`+/=`) sont tous deux acceptés. Le gabarit embarqué `tpl=` est
automatiquement **gzippé puis encodé** pour raccourcir l'URL ; les anciens liens restent compatibles.

Encodage (JavaScript, avec accents/UTF-8) :

```js
function encodeB64Url(obj) {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
```

Exemples d'appel depuis n'importe quelle application (`ORIGINE` = origine de cette
application, ex. `https://gesteg-doc.vercel.app`) :

```js
const ORIGINE = 'https://gesteg-doc.vercel.app'

// Via l'API (redirection, mode simple utilisateur)
await fetch(`${ORIGINE}/api/print`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ templateId: 'facture', data: { facture: { numero: 'FAC-2027-001' } }, toolbar: false }),
})

// URL directe (gabarit enregistré, mode simple utilisateur)
const data = encodeB64Url({ facture: { numero: 'FAC-2027-001' } })
window.open(`${ORIGINE}/print?template=facture&data=${data}&toolbar=0`, '_blank')

// Gabarit embarqué (sans enregistrement préalable)
window.open(`${ORIGINE}/print?tpl=${encodeB64Url(gabaritJson)}&data=${data}&toolbar=0`, '_blank')
```

---

## 7. Architecture et fichiers

```
get_pdf/
├─ src/                     # Front React
│  ├─ main.jsx              # Point d'entrée
│  ├─ App.jsx               # Routes (/, /edit/:id, /print)
│  ├─ pages/                # Home, Editor, PrintView, Documentation
│  ├─ components/           # Palette, éditeur, panneaux, Document…
│  │  ├─ elements/          # Rendu des éléments (title, field, table, image…)
│  │  ├─ EditableElement.jsx# Nœud éditable en mode Flux (drag & drop, blocs)
│  │  ├─ FreeEditable.jsx   # Nœud éditable en mode Libre (positionnement absolu,
│  │  │                     #   poignées de redimensionnement, guides d'alignement)
│  │  └─ ZoomableSheet.jsx  # Zoom (Ajuster / 50 / 75 / 100 %)
│  ├─ hooks/                # usePrintPageStyle, useHistory (annuler / rétablir), useAuth
│  └─ lib/                  # template (modèle), layout (mode libre), tree (arbres),
│                           # guide (génération du guide .md), storage, auth, url, resolve,
│                           # dnd, pdf (téléchargement PDF)
├─ server/
│  ├─ app.js                # Application Express (routes /api + serveur du build dist/)
│  ├─ auth.js               # Comptes (scrypt), sessions Redis, mot de passe
│  ├─ storage.js            # Stockage clé/valeur (Redis Upstash ou mémoire en dev)
│  ├─ scripts/
│  │  └─ add-user.js        # Création de comptes par l'admin (npm run adduser)
│  └─ data/                 # Données locales de dev
├─ api/
│  └─ index.js              # Point d'entrée Vercel (exporte l'application Express)
├─ vercel.json              # Déploiement Vercel : API + fallback SPA + inclut dist/
├─ docs/
│  └─ INTEGRATION.md        # Guide d'intégration (API / URL)
├─ dist/                    # Build de production
├─ vite.config.js           # Config Vite + proxy /api
└─ package.json
```

Le **stockage des gabarits** : `localStorage` du navigateur (édition hors ligne) et, côté
serveur, `server/storage.js` s'appuie sur Redis Upstash (production) ou la mémoire
(développement local). Les gabarits sont **rattachés au compte** connecté.
Voir la [section 9](#9-stockage-des-données-et-déploiement-vercel) pour les détails.

---

## 8. Dépannage

- **« Synchronisation impossible » dans l'éditeur** : vous n'êtes pas connecté ou le
  serveur API est injoignable. Connectez-vous (`/login`), ou vérifiez `npm run dev`
  (ou `npm start` après build) localement.
- **Je ne vois pas mes gabarits sur un autre appareil** : connectez-vous avec le même
  compte — chaque compte a ses propres gabarits, synchronisés sur le serveur.
- **Le PDF ne prend pas le bon format / orientation** : vérifiez l'onglet **Page**
  (format, orientation, marge) puis réessayez — privilégiez **Télécharger PDF**.
- **URL de partage très longue** : une image de fond volumineuse allonge l'URL.
  Préférez l'URL `?template=<id>` (gabarit enregistré sur le serveur) à `?tpl=…`.
- **L'impression automatique ne se déclenche pas** : certains navigateurs/bloqueurs
  bloquent `window.print()`. Utilisez le bouton « Imprimer / PDF ».
- **Le rendu du navigateur diffère de la conception** : les réglages d'impression du
  navigateur (marges, « ajuster à la page ») peuvent déformer la page. Utilisez le bouton
  **Télécharger PDF**, qui génère un fichier fidèle sans passer par la boîte de dialogue.
- **Les données ne s'affichent pas** : vérifiez les chemins dans l'onglet **Données**
  et les références des champs (`facture.numero`…). Le JSON doit être un objet.
- **La connexion renvoie `500` avec `"[object Object]" is not valid JSON`** : le compte
  correspondant à cet email existe dans Redis mais son enregistrement est illisible
  (corrompu par une ancienne version). Recréez-le avec la même commande que la création
  initiale — l'enregistrement corrompu sera automatiquement remplacé :
  `npm run adduser -- --email <votre-email> --password '<mot-de-passe>' --name "<Nom>"`.

---

## 9. Stockage des données et déploiement (Vercel)

### Comment fonctionne le stockage ?

L'édition s'appuie d'abord sur le **`localStorage` du navigateur** (clé
`get_pdf_templates_v2`) : chaque modification est enregistrée automatiquement dans le
navigateur, même hors connexion. En plus, une fois **connecté**, le gabarit est
**synchronisé sur le serveur** et rattaché à votre compte : vous le retrouvez depuis
n'importe quel appareil.

Côté serveur, `server/storage.js` expose une API clé/valeur utilisant :

| Backend | Activation | Où vivent les données |
|---|---|---|
| **Redis Upstash** *(recommandé, prod)* | `STORAGE_KV_REST_API_URL` + `STORAGE_KV_REST_API_TOKEN` (fournis par l'intégration Vercel), ou `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Votre base Redis Upstash |
| **Mémoire** *(développement local)* | aucun réglage | RAM du processus — **non persistante** (perdue au redémarrage) |

Clés utilisées : `templates:<userId>` (les gabarits du compte), `public_templates`
(miroir public pour les liens de partage `/print`), `user:email:…` / `user:id:…`
(comptes) et `session:<token>` (sessions, valables 30 jours).

### Comptes et connexion

Il n'y a **pas d'inscription publique** : les comptes sont créés par l'administrateur.

```bash
# Depuis le dossier du projet, avec les variables Redis définies dans l'environnement
npm run adduser -- --email moi@exemple.fr --password 'motdepasse' --name "Moi"
```

Réinitialiser un mot de passe (récupération) :

```bash
npm run adduser -- --email moi@exemple.fr --password 'nouveaumotdepasse' --reset
```

Le script `server/scripts/add-user.js` exige une base Redis configurée (il écrit dans la
**même** base que la production — définissez les variables `STORAGE_*` du Vercel
integration en local). Sans Redis, ajoutez `--dev` pour un test rapide (comptes stockés
en mémoire, perdus au redémarrage).

La connexion se fait sur `/login` (email + mot de passe). La session est un cookie
`httpOnly`, `SameSite=Lax`, valable 30 jours. Les mots de passe sont hachés (scrypt salé)
et jamais renvoyés par l'API.

### Synchronisation (Auto ou Ctrl+S)

Dans l'éditeur, un bouton bascule entre deux modes :

- **Auto** : chaque modification est synchronisée sur le serveur (léger délai de 1,2 s
  pour regrouper les frappes).
- **Ctrl+S** : synchronisation **manuelle** — un indicateur **« Non enregistré
  (Ctrl+S) »** s'affiche tant que vous n'avez pas pressé `Ctrl`/`Cmd`+`S`. Le bouton
  **Enregistrer** fait la même chose. Une alerte prévient avant de quitter la page si
  des modifications ne sont pas encore synchronisées.

La lecture d'un gabarit (`/edit/:id`) charge d'abord la copie locale, puis la version
serveur si elle existe (gabarit partagé ouvert sur un autre appareil).

### Les liens de partage restent publics

`/print?template=<id>` est accessible **sans connexion** : c'est le but du partage. Les
gabarits enregistrés sont exposés par leur identifiant unique. Si vous supprimez un
gabarit, son lien renvoie « Gabarit introuvable ».

### Déployer sur Vercel (l'API est pré-configurée)

Le dépôt contient déjà ce qu'il faut pour que **l'API soit déployée** avec le front :

- `api/index.js` : point d'entrée Vercel qui exporte l'application Express.
- `vercel.json` : route `/api/*` vers la fonction serverless, **fallback SPA** pour les
  routes front (`/print`, `/edit/:id`, `/login`…), et inclut le build `dist/`.

Étapes :

1. Poussez le code sur Git — le dépôt doit contenir `api/index.js` et `vercel.json`.
2. Dans le tableau de bord Vercel, importez le dépôt (framework **Vite** détecté).
3. Installez la base **Upstash Redis** (Vercel Marketplace → votre projet) : elle ajoute
   automatiquement `STORAGE_KV_REST_API_URL` et `STORAGE_KV_REST_API_TOKEN`.
4. Créez votre compte : `npm run adduser -- --email … --password …` (avec les variables
   `STORAGE_*` définies dans votre environnement local).
5. Déployez, puis vérifiez `https://<votre-app>.vercel.app/api/health` (doit répondre en
   JSON avec `"backendEffectif":"redis"`), connectez-vous et testez la synchronisation.

> **Diagnostic** : si `/api/health` répond en HTML au lieu de JSON, le déploiement est
> resté **statique** (l'API n'est pas déployée) — vérifiez `api/index.js` + `vercel.json`.
> Si une route front (`/print`, `/login`…) renvoie un `404: NOT_FOUND` Vercel, le
> fallback SPA n'est pas en place — vérifiez le `rewrites` `/(.*)` → `/index.html`.

### Et sur Vercel, ça fonctionne ?

- **Front + API + connexion + synchronisation** : fonctionnent. Sessions et gabarits
  vivent dans **Upstash Redis** (persistant, non éphémère).
- **`/print?tpl=<base64url>` (gabarit embarqué)** : fonctionne **partout** — tout est
  dans l'URL, le rendu est 100 % côté client.
- **`/print?template=<id>` (serveur)** : fonctionne sans connexion via le miroir public.

### Recommandations

- **Retrouver ses gabarits partout** : connectez-vous. Chaque compte a **ses propres**
  gabarits ; la synchronisation (Auto ou Ctrl+S) les met sur le serveur.
- **Partager avec d'autres personnes** : la modal **Partager** → URL serveur
  `/print?template=<id>` ou URL autosuffisante `tpl=` (embarquée, sans serveur).
- **Sécurité** : mots de passe hachés (scrypt salé), cookie de session `httpOnly`, pas
  d'inscription publique — les comptes sont créés uniquement par l'administrateur.

---

## 10. Documentation complémentaire

- [docs/INTEGRATION.md](docs/INTEGRATION.md) : guide détaillé d'intégration pour
  consommer l'API et l'URL d'impression depuis une autre application.
