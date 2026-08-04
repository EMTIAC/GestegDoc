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
- **Stockage interchangeable** : fichier local, Redis Upstash ou **MySQL externe** — le
  même serveur MySQL peut servir en local **et** sur Vercel, sans base de données gérée
  dans le projet (voir [section 9](#9-stockage-des-données-et-déploiement-vercel)).

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
**Imprimer / PDF**, **Exporter**, **Importer**, **Enregistrer serveur**, **Réinitialiser**.

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
- **Enregistrer serveur** : copie le gabarit vers le stockage serveur configuré
  (fichier local, Redis ou MySQL — voir [section 9](#9-stockage-des-données-et-déploiement-vercel))
  pour qu'il soit accessible via l'API et l'URL serveur.

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

Routes préfixées `/api`. Le stockage réel derrière ces routes (fichier local, Redis ou
MySQL) dépend des variables d'environnement — voir la [section 9](#9-stockage-des-données-et-déploiement-vercel).

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/templates` | Liste des gabarits enregistrés côté serveur |
| `GET` | `/api/templates/:id` | Récupère un gabarit |
| `PUT` | `/api/templates/:id` | Enregistre (crée ou écrase) un gabarit |
| `DELETE` | `/api/templates/:id` | Supprime un gabarit |
| `POST` | `/api/print` | Construit l'URL d'impression (redirection 302) |

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

Réponse : **302** vers `/print?template=<id>&data=<encodé>[&autoprint=1]`, ou **200**
`{ "url": "..." }` avec `?redirect=false`.

---

## 6. URL d'impression

```
/print?template=<id>&data=<base64url JSON>&autoprint=1
```

| Paramètre | Description |
|---|---|
| `template` | Id du gabarit (serveur ou localStorage du navigateur) |
| `tpl` | **Alternative autosuffisante** : gabarit complet encodé en base64url, sans serveur |
| `data` | Données du document en base64url JSON |
| `autoprint` | `1` = impression automatique au chargement |

Base64url et base64 classique (`+/=`) sont tous deux acceptés.

Encodage (JavaScript, avec accents/UTF-8) :

```js
function encodeB64Url(obj) {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
```

Exemples d'appel depuis n'importe quelle application :

```js
// Via l'API (redirection)
await fetch('/api/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ templateId: 'facture', data: { facture: { numero: 'FAC-2027-001' } }, autoprint: true }),
})

// URL directe
const data = encodeB64Url({ facture: { numero: 'FAC-2027-001' } })
window.open(`/print?template=facture&data=${data}`, '_blank')

// Gabarit embarqué (sans enregistrement préalable)
window.open(`/print?tpl=${encodeB64Url(gabaritJson)}&data=${data}`, '_blank')
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
│  ├─ hooks/                # usePrintPageStyle, useHistory (annuler / rétablir)
│  └─ lib/                  # template (modèle), layout (mode libre), tree (arbres),
│                           # guide (génération du guide .md), storage, url, resolve,
│                           # dnd, pdf (téléchargement PDF)
├─ server/
│  ├─ app.js                # Application Express (routes /api + serveur du build dist/)
│  ├─ index.js              # Point d'entrée local (app.listen — `npm run dev`, `npm start`)
│  ├─ storage.js            # Stockage interchangeable (fichier / Redis / MySQL)
│  └─ data/                 # templates.json (créé au premier enregistrement serveur)
├─ api/
│  └─ index.js              # Point d'entrée Vercel (exporte l'application Express)
├─ vercel.json              # Déploiement Vercel : route tout vers l'API + inclut dist/
├─ docs/
│  └─ INTEGRATION.md        # Guide d'intégration (API / URL)
├─ dist/                    # Build de production
├─ vite.config.js           # Config Vite + proxy /api
└─ package.json
```

Le **stockage des gabarits** : `localStorage` du navigateur (édition) et, côté serveur,
`server/storage.js` choisit automatiquement le backend selon les variables
d'environnement : fichier local, Redis Upstash ou **MySQL externe**.
Voir la [section 9](#9-stockage-des-données-et-déploiement-vercel) pour les limites
sur Vercel.

---

## 8. Dépannage

- **« Erreur : serveur indisponible » au clic sur « Enregistrer serveur »** :
  le serveur API n'est pas lancé. Utilisez `npm run dev` (ou `npm start` après build).
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

---

## 9. Stockage des données et déploiement (Vercel)

### Comment fonctionne le « stockage » ?

L'édition s'appuie d'abord sur le **`localStorage` du navigateur** (clé
`get_pdf_templates_v2`) : chaque modification est enregistrée automatiquement dans le
navigateur. Ces gabarits ne sont **pas partagés** entre navigateurs ni entre personnes.

Côté **serveur**, un seul module (`server/storage.js`) expose l'API unifiée
(`listTemplates`, `getTemplate`, `putTemplate`, `deleteTemplate`). Le backend réel est
choisi **automatiquement** à partir des variables d'environnement, avec la priorité
**MySQL > Redis > fichier local** :

| Backend | Activation | Où vivent les données |
|---|---|---|
| **Fichier local** *(défaut)* | aucun réglage | `server/data/templates.json` (créé au premier enregistrement) |
| **Redis Upstash** *(gratuit)* | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL` + `KV_REST_API_TOKEN`) | Votre base Redis Upstash (Vercel Integration) |
| **MySQL externe** | `MYSQL_URL` **ou** `MYSQL_HOST` + `MYSQL_USER` + `MYSQL_PASSWORD` + `MYSQL_DATABASE` | Votre base MySQL hébergée ailleurs |

Variables MySQL optionnelles : `MYSQL_PORT` (défaut `3306`) et `MYSQL_SSL=1`
(pour forcer une connexion SSL — recommandé sur Vercel).

L'URL d'impression `/print?template=<id>` cherche d'abord dans le `localStorage`, puis
appelle l'API serveur si absent. L'URL `/print?tpl=<base64url>` embarque le gabarit
complet dans l'URL : elle est **autosuffisante** et ne dépend d'aucun serveur.

### Utiliser une base MySQL externe (local **et** Vercel)

Le même serveur MySQL hébergé ailleurs (PlanetScale, Railway, Aiven, OVH, Clever Cloud,
ScaleGrid, Amazon RDS…) peut servir votre app **en développement local** **et** en
production sur Vercel, sans gérer de base de données dans le projet :

1. Créez la base et un utilisateur sur votre hébergeur.
2. **Localement** : définissez les variables d'environnement ci-dessus (ou un fichier
   `.env` chargé au lancement).
3. **Sur Vercel** : ajoutez **les mêmes variables** dans *Settings → Environment
   Variables* du projet. Les fonctions serverless se connecteront à la même base.

Conditions pour que cela fonctionne depuis Vercel (serverless) :
- L'hôte MySQL doit accepter les **connexions externes** (pas de restriction par adresse
  IP — Vercel ne fournit pas d'IP statiques). Activez le « connect from anywhere » ou
  équivalent, ou utilisez un tunnel/private networking si votre plan le permet.
- Connexion **SSL** : définissez `MYSQL_SSL=1` (ou utilisez l'URL de connexion SSL du
  fournisseur). `mysql2` gère automatiquement le certificat.
- **Pool de connexions** : `server/storage.js` réutilise un pool (limité à 5 connexions)
  entre les requêtes — ne créez pas de connexion par appel.
- Attention aux **limites de connexions** de votre forfait en cas de trafic soutenu.

### Déployer sur Vercel (l'API est pré-configurée)

Le dépôt contient déjà ce qu'il faut pour que **l'API soit déployée** avec le front :

- `api/index.js` : point d'entrée Vercel qui exporte l'application Express.
- `vercel.json` : route **toutes** les requêtes vers l'application (rewrites) et inclut le
  build `dist/` dans la fonction serverless (`functions → includeFiles`).

Sur Vercel, l'application tourne donc **entièrement dans une fonction serverless** qui
gère à la fois l'interface, les routes `/api/*` (dont « Enregistrer serveur » →
`PUT /api/templates/:id`) et le fallback SPA.

Étapes :

1. Poussez le code sur Git — le dépôt doit contenir `api/index.js` et `vercel.json`.
2. Dans le tableau de bord Vercel, importez le dépôt (framework **Vite** détecté).
3. Ajoutez les variables d'environnement de votre base (voir plus haut) : `MYSQL_URL`
   (ou `MYSQL_HOST` + `MYSQL_USER` + `MYSQL_PASSWORD` + `MYSQL_DATABASE`) et `MYSQL_SSL=1`
   si votre hébergeur l'exige.
4. Déployez, puis vérifiez : ouvrez `https://<votre-app>.vercel.app/api/templates`
   (doit répondre en JSON), puis testez « Enregistrer serveur ».

> **Diagnostic** : si `GET /api/templates` renvoie la page HTML au lieu de JSON,
> c'est que le déploiement est resté **statique** (l'API n'a pas été déployée).
> Vérifiez que `api/index.js` et `vercel.json` sont bien dans le dépôt, puis redéployez.

### Et les migrations, on fait comment ?

En Laravel on écrit des **migrations** (`php artisan migrate`) car le schéma SQL évolue
à chaque fonctionnalité. Ici, le schéma est volontairement **minimal et stable** : une
seule table, qui stocke le gabarit complet sous forme de **JSON** :

```sql
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '',
  data LONGTEXT NOT NULL,          -- le gabarit complet en JSON
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

Conséquences :

- **Aucune commande à lancer.** Au démarrage du serveur, `server/storage.js` exécute
  automatiquement `CREATE TABLE IF NOT EXISTS …` : la table est créée si elle n'existe
  pas. C'est l'équivalent de votre première migration, sans `artisan`.
- **Le contenu des gabarits n'est pas un schéma.** Les « évolutions » du format d'un
  gabarit (nouveau champ, nouvelle propriété, structure…) sont gérées par
  `migrateTemplate()` côté **frontend** (`src/lib/template.js`), pas par la base. La base
  ne fait que stocker du JSON ; c'est l'application qui l'interprète et le migre à la
  lecture. Aucune ALTER n'est nécessaire quand vous modifiez le gabarit.
- **Si vous devez vraiment ajouter une colonne** (ex. un index, un champ de tri), il n'y
  a pas de dossier de migrations : vous ajoutez une instruction **idempotente** dans la
  fonction `ensureMysqlTable()` de `server/storage.js`, par exemple :

  ```js
  await pool.query(`ALTER TABLE templates ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'template'`)
  ```

  Comme `CREATE TABLE IF NOT EXISTS` n'altère **pas** une table existante, une nouvelle
  colonne doit toujours passer par un `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (préfixez
  la colonne du bon `DEFAULT` pour les lignes existantes). Le serveur l'exécute à chaque
  démarrage, sans risque, puisqu'il est idempotent. C'est votre « migration » — juste
  une ligne dans le code, exécutée automatiquement.
- Les données existantes restent compatibles : la table garde une ligne par gabarit et
  la colonne `data` (JSON) ne change jamais de sens.

### Et sur Vercel, ça fonctionne ?

- **Le front + l'API** : fonctionnent. Grâce à `api/index.js` + `vercel.json`, l'API
  `/api/*` (donc « Enregistrer serveur ») est **déployée par défaut** et écrit dans le
  backend configuré (fichier, Redis ou MySQL).
- **Le stockage fichier `server/data/templates.json`** : **non fiable sur Vercel**.
  Vercel exécute des fonctions serverless avec un système de fichiers **éphémère et en
  lecture seule** : les écritures ne persistent pas (et échouent souvent). Un gabarit
  enregistré via l'API serait perdu entre deux appels. Utilisez MySQL ou Redis pour la
  persistance.
- **MySQL externe ou Redis Upstash** : fonctionne sur Vercel **et** en local avec les
  mêmes variables d'environnement. C'est la solution recommandée pour la persistance
  multi-utilisateurs.
- **`/print?tpl=<base64url>` (gabarit embarqué)** : fonctionne **partout**, y compris sur
  Vercel, car tout est dans l'URL et le rendu est 100 % côté client.
- **`/print?template=<id>` (serveur)** : sur Vercel, fonctionne si le gabarit est dans le
  `localStorage` du visiteur, ou si un backend persistant (MySQL / Redis) est configuré.

### Recommandations

- **Partager un gabarit avec d'autres personnes** : utilisez la modal **Partager** et
  privilégiez l'URL autosuffisante (`tpl=`) — elle s'ouvre chez n'importe qui, sans
  serveur. Attention : elle est longue (gabarit + données dans l'URL).
- **Persistance multi-utilisateurs** : branchez une base **MySQL externe** ou **Redis
  Upstash** (mêmes variables en local et sur Vercel). Pour un usage simple, Upstash
  (gratuit) est le plus rapide à mettre en place ; MySQL convient si vous avez déjà une
  base ou des contraintes existantes.
- Le **serveur Express local** (`npm start`) reste le plus simple pour un usage
  auto-hébergé complet (stockage fichier inclus, sans configuration).

---

## 10. Documentation complémentaire

- [docs/INTEGRATION.md](docs/INTEGRATION.md) : guide détaillé d'intégration pour
  consommer l'API et l'URL d'impression depuis une autre application.
