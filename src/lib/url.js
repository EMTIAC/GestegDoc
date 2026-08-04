// Encodage base64url (sûr UTF-8) pour passer des données/gabarits dans l'URL.
// Depuis la version compressée : les payloads sont préfixés pour rester
// rétrocompatibles avec les anciens liens (sans préfixe) :
//   - `z0:` → JSON encodé en base64url sans compression (petits payloads)
//   - `z1:` → JSON compressé (gzip) puis base64url (payloads plus gros)
//   - (aucun préfixe) → ancien format base64url simple, toujours décodable.

function bytesToB64url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBytes(b64) {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(pad)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function compress(str) {
  const bytes = new TextEncoder().encode(str)
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function decompress(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function encodeData(data) {
  const json = JSON.stringify(data)
  const plain = bytesToB64url(new TextEncoder().encode(json))
  // La compression ne profite qu'aux payloads suffisamment gros.
  if (json.length < 1000) return 'z0:' + plain
  try {
    const c = bytesToB64url(await compress(json))
    if (c.length < plain.length) return 'z1:' + c
  } catch {
    // CompressionStream indisponible (navigateur ancien) → format simple.
  }
  return 'z0:' + plain
}

export async function decodeData(payload) {
  let bytes
  if (payload.startsWith('z1:')) {
    bytes = await decompress(b64urlToBytes(payload.slice(3)))
  } else {
    const body = payload.startsWith('z0:') ? payload.slice(3) : payload
    bytes = b64urlToBytes(body)
  }
  return JSON.parse(new TextDecoder().decode(bytes))
}
