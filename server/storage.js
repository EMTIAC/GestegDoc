import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')

// Clés Redis
const STORE_KEY = 'templates' // ancienne clé globale (migrée au premier login)
const PUB_KEY = 'public_templates' // miroir public : nécessaire aux liens de partage /print
export function templatesKey(userId) {
  return userId ? `templates:${userId}` : STORE_KEY
}

// Fallback mémoire (développement local sans Redis).
const memory = new Map()

// ————— Client Redis (Upstash / Vercel integration) —————
let kvInit
let kvError = null
// Noms de variables d'env supportés : l'intégration Upstash via le Vercel
// Marketplace préfixe par STORAGE_ ; @vercel/kv historique utilise KV_ ; l'app
// supporte aussi UPSTASH_REDIS_* directement.
export function redisVars() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.STORAGE_KV_REST_API_URL ||
    process.env.STORAGE_REDIS_URL ||
    null
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.STORAGE_KV_REST_API_TOKEN ||
    null
  return { url, token }
}
// Initialisation paresseuse : pas d'await au niveau du module (robuste à la
// compilation en CommonJS par Vercel).
function getKv() {
  if (kvInit === undefined) {
    kvInit = (async () => {
      const { url, token } = redisVars()
      if (!url || !token) return null
      const { Redis } = await import('@upstash/redis')
      return new Redis({ url, token })
    })().catch((err) => {
      kvError = err?.message || String(err)
      console.error('[storage] Redis indisponible, bascule sur la mémoire :', kvError)
      return null
    })
  }
  return kvInit
}

export function kvReady() {
  const { url, token } = redisVars()
  return !!(url && token)
}

// ————— API KV générique (Redis si dispo, sinon mémoire) —————
export async function kvGet(key) {
  const kv = await getKv()
  if (kv) {
    const v = await kv.get(key)
    return v == null ? undefined : v
  }
  return memory.get(key)
}

export async function kvSet(key, value, ttlSeconds) {
  const kv = await getKv()
  if (kv) {
    await kv.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined)
  } else {
    memory.set(key, value)
  }
}

export async function kvDel(key) {
  const kv = await getKv()
  if (kv) await kv.del(key)
  else memory.delete(key)
}

// ————— Maps sérialisées en JSON —————
async function readMap(key) {
  const raw = await kvGet(key)
  if (raw == null) return {}
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeMap(key, map) {
  await kvSet(key, JSON.stringify(map))
}

// ————— Gabarits —————
export async function listTemplates(userId) {
  return Object.values(await readMap(templatesKey(userId)))
}

// Lecture publique par id (liens de partage) : passe par le miroir public.
export async function getTemplate(id, userId) {
  const pub = await readMap(PUB_KEY)
  if (pub[id]) return pub[id]
  if (userId) {
    const mine = await readMap(templatesKey(userId))
    if (mine[id]) return mine[id]
  }
  return null
}

export async function putTemplate(id, body, userId) {
  const tpl = { ...body, meta: { ...(body.meta || {}), id } }
  if (userId) {
    const mine = await readMap(templatesKey(userId))
    mine[id] = tpl
    await writeMap(templatesKey(userId), mine)
  }
  // Miroir public : garde les liens de partage actifs pour tout le monde.
  const pub = await readMap(PUB_KEY)
  pub[id] = tpl
  await writeMap(PUB_KEY, pub)
  return { ok: true, id }
}

export async function deleteTemplate(id, userId) {
  if (userId) {
    const mine = await readMap(templatesKey(userId))
    if (mine[id]) {
      delete mine[id]
      await writeMap(templatesKey(userId), mine)
    }
  }
  const pub = await readMap(PUB_KEY)
  if (pub[id]) {
    delete pub[id]
    await writeMap(PUB_KEY, pub)
  }
  return { ok: true }
}

// Migration : déplace les gabarits de l'ancienne clé globale vers le compte.
export async function migrateLegacyTemplates(userId) {
  if (!userId) return 0
  const legacy = await readMap(STORE_KEY)
  const ids = Object.keys(legacy)
  if (!ids.length) return 0
  const mine = await readMap(templatesKey(userId))
  const pub = await readMap(PUB_KEY)
  let moved = 0
  for (const id of ids) {
    if (!mine[id]) {
      mine[id] = legacy[id]
      moved++
    }
    if (!pub[id]) pub[id] = legacy[id]
  }
  if (moved) await writeMap(templatesKey(userId), mine)
  await writeMap(PUB_KEY, pub)
  await kvDel(STORE_KEY)
  return moved
}

// ————— État effectif, pour diagnostic (/api/health) —————
export async function storageStatus() {
  const { url, token } = redisVars()
  return {
    modeConfigured: storageMode(),
    backendEffectif: (await getKv()) ? 'redis' : 'mem',
    redisConfigured: !!(url && token),
    redisUrl: !!url,
    redisToken: !!token,
    redisError: kvError || null,
  }
}

export function storageMode() {
  if (kvReady()) return 'redis (Upstash / Vercel integration)'
  return 'mémoire (développement)'
}
