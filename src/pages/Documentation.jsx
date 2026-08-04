import { Link } from 'react-router'

function InlineCode({ children }) {
  return <code>{children}</code>
}

export default function Documentation() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '<origine>'
  return (
    <div className="docs">
      <header className="toolbar">
        <Link to="/" className="brand">
          <span className="logo">▣</span>
          <span className="brand-name">Générateur de PDF</span>
        </Link>
        <span className="print-title">Documentation</span>
        <div className="toolbar-actions">
          <Link className="btn" to="/">Accueil</Link>
        </div>
      </header>
      <main className="docs-main">
        <div className="docs-container">
          <h1>Générateur de PDF — guide d'utilisation</h1>
          <p className="docs-intro">
            Cette application permet de concevoir des gabarits de documents (factures, devis,
            bons de commande…) et de les imprimer ou exporter en PDF, sans écrire de code.
          </p>

          <nav className="docs-toc">
            <strong>Sommaire</strong>
            <a href="#accueil">1. Accueil</a>
            <a href="#editeur">2. Éditeur</a>
            <a href="#elements">3. Éléments et mise en page</a>
            <a href="#donnees">4. Données</a>
            <a href="#pages">5. Pages et formats</a>
            <a href="#fond">6. Fond et filigrane</a>
            <a href="#impression">7. Impression</a>
            <a href="#partage">8. Partage, export et import</a>
            <a href="#integration">9. Intégration (API / URL)</a>
          </nav>

          <section id="accueil">
            <h2>1. Accueil</h2>
            <p>La page d'accueil liste tous vos gabarits. Pour chacun, vous pouvez :</p>
            <ul>
              <li><strong>Modifier</strong> — ouvrir le gabarit dans l'éditeur.</li>
              <li><strong>Imprimer</strong> — afficher le document et le transformer en PDF.</li>
              <li><strong>Partager</strong> — générer une URL d'impression utilisable par d'autres applications.</li>
              <li><strong>Exporter / Dupliquer / Supprimer</strong> — gérer vos gabarits.</li>
            </ul>
            <p>
              Vous pouvez créer un <strong>nouveau document</strong> (vierge) ou une
              <strong>facture</strong> d'exemple, et <strong>importer</strong> un gabarit depuis
              un fichier JSON.
            </p>
          </section>

          <section id="editeur">
            <h2>2. Éditeur</h2>
            <p>L'éditeur (page <InlineCode>/edit/:id</InlineCode>) est organisé en trois colonnes :</p>
            <ul>
              <li><strong>Gauche — Palette</strong> : les éléments à glisser dans la page (ou à cliquer pour les ajouter).</li>
              <li><strong>Centre — Page</strong> : le bandeau de pages, le zoom, et la page en cours, affichée telle qu'elle sera imprimée.</li>
              <li><strong>Droite — Panneaux</strong> : les onglets <em>Propriétés</em>, <em>Données</em>, <em>Page</em> et <em>Fond</em>.</li>
            </ul>
            <p>
              La barre du haut contient le nom du gabarit, et les boutons
              <strong>Guide</strong> (télécharge un guide du gabarit : données attendues,
              champs utilisés, modes d'impression), <strong>Partager</strong>,
              <strong>Aperçu</strong>, <strong>Imprimer / PDF</strong>,
              <strong>Exporter</strong>, <strong>Importer</strong>,
              <strong>Synchronisation</strong> (mode Auto ou Ctrl+S + état
              d'enregistrement), <strong>Réinitialiser</strong> et le bouton de
              <strong>connexion</strong>.
            </p>
          </section>

          <section id="elements">
            <h2>3. Éléments et mise en page</h2>
            <table className="docs-table">
              <thead>
                <tr><th>Élément</th><th>Rôle</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>Titre</strong></td><td>Grand texte de titre</td></tr>
                <tr><td><strong>Texte</strong></td><td>Paragraphe (supporte <InlineCode>{'{{chemin}}'}</InlineCode>)</td></tr>
                <tr><td><strong>Champ lié</strong></td><td>Libellé + valeur issue des données (<InlineCode>facture.numero</InlineCode>)</td></tr>
                <tr><td><strong>Tableau</strong></td><td>Table dynamique alimentée par un tableau de données (<InlineCode>lignes</InlineCode>)</td></tr>
                <tr><td><strong>Bloc</strong></td><td>Conteneur : y déposer des éléments, côte à côte ou imbriqués ; répétable sur des données</td></tr>
                <tr><td><strong>Image</strong></td><td>Image par URL ou upload local, avec dimensions, ajustement (remplir / contenir / étirer) et rayon. L'URL accepte les données dynamiques (<InlineCode>{'{{facture.logo_url}}'}</InlineCode>)</td></tr>
                <tr><td><strong>Séparateur</strong></td><td>Trait horizontal</td></tr>
                <tr><td><strong>Espace</strong></td><td>Blanc vertical réglable</td></tr>
              </tbody>
            </table>
            <h3>Blocs (conteneurs) — blocs côte à côte et imbrication</h3>
            <ul>
              <li>
                Ajoutez un <strong>Bloc</strong>, réglez sa largeur (ex. 1/2), puis
                <strong>glissez des éléments dedans</strong> (dans la zone « Déposez des éléments ») ou
                cliquez sur sa zone inférieure « ＋ ». Les éléments d'un bloc se placent côte à côte selon
                leur largeur, comme sur la page.
              </li>
              <li>
                Les blocs peuvent être <strong>imbriqués</strong> à l'infini et réordonnés par
                glisser-déposer (ou boutons ↑ ↓).
              </li>
              <li>
                <strong>Répétition</strong> : dans les propriétés d'un bloc, renseignez une
                <strong>Source des données</strong> (ex. <InlineCode>clients</InlineCode>). Le bloc est alors
                répété pour chaque ligne du tableau, et ses champs lus dans chaque ligne
                (ex. champ <InlineCode>nom</InlineCode> → <InlineCode>clients[0].nom</InlineCode>). Ceci permet de
                générer des cartes, fiches, étiquettes, lignes récapitulatives…
              </li>
              <li>
                Propriétés du bloc : marge intérieure, espacement interne, hauteur minimale,
                fond (transparent possible), bordure et rayon.
              </li>
            </ul>
            <h3>Sélectionner, déplacer, organiser</h3>
            <ul>
              <li><strong>Sélectionner</strong> : cliquer sur l'élément — son contour devient bleu et une barre d'actions (↑ ↓ dupliquer supprimer) apparaît.</li>
              <li><strong>Réordonner</strong> : glisser un élément sur un autre ou dans la page.</li>
              <li><strong>Largeur</strong> : dans l'onglet <em>Propriétés</em>, choisir 100 %, 1/2, 1/3, 2/3, 1/4 ou 3/4 de la largeur. Les éléments plus étroits que 100 % se placent <strong>côte à côte</strong>.</li>
              <li><strong>Barre d'actions</strong> : elle n'apparaît qu'au survol de l'élément (↑ ↓ pour monter/descendre, ⧉ pour dupliquer, ✕ pour supprimer). Elle reste affichée environ une seconde après que la souris quitte l'élément, le temps de l'atteindre.</li>
            </ul>
            <h3>Guide téléchargeable</h3>
            <p>
              Le bouton <strong>Guide</strong> (barre du haut de l'éditeur, ou sur chaque
              gabarit de la page d'accueil) télécharge un fichier <InlineCode>.md</InlineCode>
              qui récapitule tout ce qu'il faut pour réutiliser le gabarit : format de page,
              structure des données d'exemple, liste de tous les champs utilisés par les
              éléments (champs liés, variables de texte, tableaux, blocs répétés), et les
              modes d'impression (URL et API).
            </p>
          </section>

          <section id="donnees">
            <h2>4. Données</h2>
            <p>
              L'onglet <strong>Données</strong> contient un JSON qui détermine les valeurs
              injectées dans le document. Les champs utilisent des chemins avec des points :
            </p>
            <pre>{`{
  "entreprise": { "nom": "Ma Société", "siret": "123..." },
  "facture": { "numero": "FAC-2026-001", "client": "Jean Dupont", "totalTTC": "1 500,00 €" },
  "lignes": [
    { "designation": "Prestation", "quantite": "10", "prix": "120,00 €", "total": "1 200,00 €" }
  ]
}`}</pre>
            <ul>
              <li>Un <strong>champ lié</strong> à <InlineCode>facture.numero</InlineCode> affiche la valeur correspondante.</li>
              <li>Un <strong>tableau</strong> dont la source est <InlineCode>lignes</InlineCode> répète ses colonnes pour chaque ligne.</li>
              <li>Dans un texte, <InlineCode>{'{{facture.client}}'}</InlineCode> est remplacé par la valeur.</li>
            </ul>
            <p>Cliquer sur <strong>Appliquer</strong> pour valider. Le JSON doit être un objet.</p>
          </section>

          <section id="pages">
            <h2>5. Pages et formats</h2>
            <ul>
              <li>
                <strong>Bandeau de pages</strong> : ajouter une page (<InlineCode>+ Page</InlineCode>),
                la sélectionner, la réordonner (◀ ▶) et la supprimer. Chaque page se compose
                indépendamment.
              </li>
              <li>
                <strong>Onglet Page</strong> : format (A0→A8, B4/B5/B6, enveloppes C4/C5/C6,
                formats américains, ou <strong>Personnalisé</strong> en millimètres),
                orientation (portrait / paysage) et marge. Le format s'applique à tout le document.
              </li>
              <li>
                <strong>Mise en page</strong> : deux modes par page — <em>Flux</em> (les éléments se
                placent les uns après les autres, comme dans un document Word) et <em>Libre</em>
                (positionnement type Figma). En mode <strong>Libre</strong> : glissez chaque élément
                pour le déplacer, utilisez les <strong>poignées</strong> pour le redimensionner,
                des <strong>guides roses</strong> et l'aimantation aident à aligner sur le centre, les
                bords et les autres éléments. Les coordonnées (X, Y, largeur, hauteur en mm) sont
                modifiables dans l'onglet <em>Propriétés</em>. Les éléments s'empilent selon leur ordre
                dans la liste (boutons ↑ ↓ pour changer le plan).
              </li>
            </ul>
          </section>

          <section id="fond">
            <h2>6. Fond et filigrane</h2>
            <p>L'onglet <strong>Fond</strong> s'applique à la page active :</p>
            <ul>
              <li><strong>Fond</strong> : aucun, couleur unie, ou image de fond (avec upload, opacité et ajustement remplir/ajuster).</li>
              <li><strong>Filigrane</strong> : texte (contenu, opacité, taille, inclinaison).</li>
            </ul>
            <p>Tout ce qui est posé ici s'imprime dans le PDF.</p>
          </section>

          <section id="impression">
            <h2>7. Impression</h2>
            <p>
              <strong>Télécharger PDF</strong> : génère directement le fichier PDF en respectant
              le format, l'orientation, les marges, les fonds/filigranes et la mise en page prévus
              (aucun réglage du navigateur n'intervient).
            </p>
            <p>
              <strong>Imprimer / PDF</strong> : ouvre la boîte de dialogue d'impression du navigateur,
              utile pour imprimer sur papier. Attention : selon les réglages du navigateur
              (marges, « ajuster à la page »), le rendu peut différer — privilégiez
              <strong>Télécharger PDF</strong> pour un fichier fidèle.
            </p>
          </section>

          <section id="partage">
            <h2>8. Partage, export et import</h2>
            <ul>
              <li>
                <strong>Partager</strong> : génère une URL d'impression (portable ou serveur)
                avec bouton « Copier ». Voir la section suivante. L'URL <em>portable</em>
                (qui embarque le gabarit) s'ouvre chez n'importe qui, sans serveur.
              </li>
              <li><strong>Exporter</strong> : télécharge le gabarit au format JSON.</li>
              <li><strong>Importer</strong> : charge un gabarit depuis un fichier JSON.</li>
              <li>
                <strong>Synchronisation</strong> (bouton dans la barre du haut) : une fois
                connecté, le gabarit est enregistré sur le serveur et rattaché à votre
                compte. Deux modes au choix : <strong>Auto</strong> (chaque modification
                est synchronisée) ou <strong>Ctrl+S</strong> (manuel — un indicateur
                « Non enregistré (Ctrl+S) » s'affiche tant que la sauvegarde n'a pas été
                faite). Vos gabarits sont ainsi retrouvables depuis n'importe quel
                appareil.
              </li>
            </ul>
          </section>

          <section id="integration">
            <h2>9. Intégration (API / URL)</h2>
            <p>
              N'importe quelle application peut envoyer ses utilisateurs sur une page
              d'impression avec ses propres données, de <strong>trois manières</strong> :
            </p>
            <ol>
              <li>
                <strong>Gabarit embarqué dans l'URL</strong> (<InlineCode>tpl=</InlineCode>) —
                aucun serveur requis, mais URL longue (limite à respecter avec de grosses
                images).
              </li>
              <li>
                <strong>Gabarit enregistré</strong> (<InlineCode>template=&lt;id&gt;</InlineCode>)
                — URL courte, gabarit enregistré sur le serveur. <strong>Recommandé.</strong>
              </li>
              <li>
                <strong>API</strong> (<InlineCode>POST /api/print</InlineCode>) — votre serveur
                appelle l'API, qui répond par une redirection vers la page d'impression. Les
                données ne transitent pas par l'URL.
              </li>
            </ol>
            <p>
              Dans tous les cas, les URL sont <strong>absolues</strong> : elles commencent
              par l'origine de cette application (<InlineCode>{origin}</InlineCode>) et
              fonctionnent depuis n'importe quel autre site.
            </p>

            <h3>Gabarit embarqué (sans serveur)</h3>
            <pre>{`${origin}/print?tpl=<gabarit encodé base64url>&toolbar=0`}</pre>

            <h3>Gabarit enregistré (URL courte, recommandé)</h3>
            <pre>{`${origin}/print?template=<id>&data=<base64url JSON>&toolbar=0`}</pre>

            <h3>API</h3>
            <p>
              Votre serveur appelle <InlineCode>POST {origin}/api/print</InlineCode> avec{' '}
              <InlineCode>{'{ templateId, data, autoprint, toolbar }'}</InlineCode> (ou un
              gabarit <InlineCode>template</InlineCode> complet). Le serveur répond par une
              <strong>redirection 302</strong> vers la page d'impression, ou par un JSON{' '}
              <InlineCode>{'{ "url": "..." }'}</InlineCode> avec{' '}
              <InlineCode>?redirect=false</InlineCode>. Les gabarits sont aussi exposés en{' '}
              <InlineCode>GET/PUT/DELETE {origin}/api/templates</InlineCode>.
            </p>

            <h3>Paramètres communs</h3>
            <ul>
              <li>
                <InlineCode>data</InlineCode> : données du document (base64url JSON).
              </li>
              <li>
                <InlineCode>toolbar=0</InlineCode> : <strong>mode simple utilisateur</strong> —
                la page s'affiche sans les boutons Modifier / Accueil / Aide (recommandé quand
                le visiteur vient juste imprimer). Sans ce paramètre, mode professionnel.
              </li>
              <li>
                <InlineCode>autoprint=1</InlineCode> : <strong>optionnel</strong> — ouvre la
                boîte de dialogue d'impression automatiquement au chargement. À n'utiliser que
                si nécessaire (sinon elle s'ouvre à chaque chargement/rechargement).
              </li>
              <li>
                <InlineCode>download=1</InlineCode> : <strong>télécharge directement le PDF</strong>{' '}
                dès l'ouverture du lien, sans passer par la page d'impression. Idéal pour un
                bouton « Télécharger » sur votre site.
              </li>
              <li>
                <InlineCode>pdf=1</InlineCode> : ouvre le PDF dans le{' '}
                <strong>lecteur PDF natif du navigateur</strong> (outils habituels : Enregistrer,
                Télécharger, Imprimer) au lieu de la page d'impression de l'application.
              </li>
            </ul>
            <p>
              <strong>Exemples</strong> :{' '}
              <InlineCode>?template=&lt;id&gt;&amp;download=1</InlineCode> (téléchargement
              automatique), <InlineCode>?template=&lt;id&gt;&amp;pdf=1</InlineCode> (lecteur PDF).
            </p>
            <p>
              Le gabarit embarqué <InlineCode>tpl=</InlineCode> est maintenant{' '}
              <strong>compressé</strong> (gzip + base64url) pour raccourcir l'URL ; les anciens
              liens restent compatibles.
            </p>

            <h3>Quelle méthode choisir ?</h3>
            <table className="docs-table">
              <thead>
                <tr><th></th><th>Embarqué (<InlineCode>tpl=</InlineCode>)</th><th>Enregistré (<InlineCode>template=</InlineCode>)</th><th>API</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>Qui l'utilise</strong></td><td>Lien/bouton (navigateur)</td><td>Lien/bouton (navigateur)</td><td>Votre serveur (appel HTTP)</td></tr>
                <tr><td><strong>Serveur requis</strong></td><td>Non</td><td>Oui (gabarit enregistré)</td><td>Oui</td></tr>
                <tr><td><strong>Résultat</strong></td><td>Page d'impression ouverte</td><td>Page d'impression ouverte</td><td>Redirection 302 (ou URL JSON) à suivre</td></tr>
                <tr><td><strong>Taille de l'URL</strong></td><td>Longue (limite à respecter)</td><td>Courte</td><td>Toujours courte (données hors URL)</td></tr>
                <tr><td><strong>Usage typique</strong></td><td>Démo, gabarit non enregistré</td><td>La plupart des cas</td><td>Backend qui construit l'URL</td></tr>
              </tbody>
            </table>
            <p>
              <strong>Recommandation</strong> : dans la majorité des cas, utilisez la forme
              <strong>enregistrée</strong> (<InlineCode>?template=&lt;id&gt;</InlineCode>)
              avec <InlineCode>toolbar=0</InlineCode>. Passez à l'API si vous construisez
              l'URL côté serveur ou si l'URL devient trop longue. Réservez{' '}
              <InlineCode>tpl=</InlineCode> aux gabarits simples.
            </p>
            <p>
              Le guide complet est dans le fichier <InlineCode>docs/INTEGRATION.md</InlineCode>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
