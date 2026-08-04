import { createContext } from 'react'

// Valeur de cache-busting propagée à la page d'impression : les images chargées
// depuis des URLs externes (Cloudinary, serveur de l'utilisateur…) sont souvent
// mises en cache par le navigateur ou le CDN. Sur la page /print, on ajoute un
// paramètre `v=<timestamp>` à chaque image http(s) pour forcer un rechargement
// frais à chaque ouverture du lien (les photos reflètent toujours l'état actuel).
export const CacheBustContext = createContext(null)
