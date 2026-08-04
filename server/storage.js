import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const STORE_FILE = path.join(DATA_DIR, 'templates.json')
const STORE_KEY = 'templates'

// ————— Backend fichier (local) —————
function readFileStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeFileStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2))
}

// ————— Backend Redis (Upstash / Vercel integration) —————
let kvInit
let kvError = null
// Noms de variables d'env supportés : l'intégration Upstash via le Vercel
// Marketplace préfixe par STORAGE_ ; @vercel/kv historique utilise KV_ ; l'app
// supporte aussi UPSTASH_REDIS_* directement.
function redisVars() {
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
      console.error('[storage] Redis indisponible, bascule sur un autre backend :', kvError)
      return null
    })
  }
  return kvInit
}

async function readRedisStore() {
  const kv = await getKv()
  if (!kv) return {}
  try {
    const raw = await kv.get(STORE_KEY)
    if (!raw) return {}
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return {}
  }
}

async function writeRedisStore(store) {
  const kv = await getKv()
  if (kv) await kv.set(STORE_KEY, store)
}

// ————— Backend MySQL (base externe, compatible Vercel) —————
function mysqlPoolConfig() {
  if (process.env.MYSQL_URL) {
    const uri = process.env.MYSQL_URL
    return process.env.MYSQL_SSL === '1' ? { uri, ssl: { rejectUnauthorized: false } } : uri
  }
  const cfg = {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,
  }
  if (process.env.MYSQL_SSL === '1') cfg.ssl = { rejectUnauthorized: false }
  return cfg
}

let mysqlInit
let mysqlError = null
// Schéma minimal + « migrations » idempotentes, exécutées à la première utilisation.
// Pour faire évoluer le schéma, ajoutez ici des ALTER TABLE idempotents (voir README).
function getMysql() {
  if (mysqlInit === undefined) {
    mysqlInit = (async () => {
      if (!process.env.MYSQL_URL && !process.env.MYSQL_HOST) return null
      const { default: mysql } = await import('mysql2/promise')
      const pool = mysql.createPool(mysqlPoolConfig())
      await pool.query(`
        CREATE TABLE IF NOT EXISTS templates (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          name VARCHAR(255) NOT NULL DEFAULT '',
          data LONGTEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      return pool
    })().catch((err) => {
      mysqlError = err?.message || String(err)
      console.error('[storage] MySQL indisponible, bascule sur un autre backend :', mysqlError)
      return null
    })
  }
  return mysqlInit
}

async function readMysqlStore() {
  const pool = await getMysql()
  const [rows] = await pool.query('SELECT id, data FROM templates')
  const store = {}
  for (const row of rows) {
    try {
      store[row.id] = JSON.parse(row.data)
    } catch {
      /* ligne corrompue : ignorée */
    }
  }
  return store
}

// ————— Sélection du backend (priorité MySQL > Redis > fichier) —————
let effectiveBackend = null
async function resolveBackend() {
  if (effectiveBackend) return effectiveBackend
  if (await getMysql()) {
    effectiveBackend = 'mysql'
    return effectiveBackend
  }
  if (await getKv()) {
    effectiveBackend = 'redis'
    return effectiveBackend
  }
  effectiveBackend = 'file'
  return effectiveBackend
}

// ————— API unifiée —————
export async function listTemplates() {
  const backend = await resolveBackend()
  if (backend === 'mysql') return Object.values(await readMysqlStore())
  if (backend === 'redis') return Object.values(await readRedisStore())
  return Object.values(readFileStore())
}

export async function getTemplate(id) {
  const backend = await resolveBackend()
  if (backend === 'mysql') {
    const pool = await getMysql()
    const [rows] = await pool.query('SELECT data FROM templates WHERE id = ?', [id])
    if (!rows.length) return null
    try {
      return JSON.parse(rows[0].data)
    } catch {
      return null
    }
  }
  if (backend === 'redis') return (await readRedisStore())[id] || null
  return readFileStore()[id] || null
}

export async function putTemplate(id, body) {
  const backend = await resolveBackend()
  const tpl = { ...body, meta: { ...(body.meta || {}), id } }
  if (backend === 'mysql') {
    const pool = await getMysql()
    const name = tpl.meta?.name || ''
    await pool.query(
      'INSERT INTO templates (id, name, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), data = VALUES(data), updated_at = NOW()',
      [id, name, JSON.stringify(tpl)]
    )
    return { ok: true, id }
  }
  if (backend === 'redis') {
    const store = await readRedisStore()
    store[id] = tpl
    await writeRedisStore(store)
    return { ok: true, id }
  }
  const store = readFileStore()
  store[id] = tpl
  writeFileStore(store)
  return { ok: true, id }
}

export async function deleteTemplate(id) {
  const backend = await resolveBackend()
  if (backend === 'mysql') {
    const pool = await getMysql()
    await pool.query('DELETE FROM templates WHERE id = ?', [id])
    return { ok: true }
  }
  if (backend === 'redis') {
    const store = await readRedisStore()
    delete store[id]
    await writeRedisStore(store)
    return { ok: true }
  }
  const store = readFileStore()
  delete store[id]
  writeFileStore(store)
  return { ok: true }
}

export function storageMode() {
  if (process.env.MYSQL_URL || process.env.MYSQL_HOST) return 'mysql (base externe)'
  if (redisVars().url) return 'redis (Upstash / Vercel integration)'
  return 'fichier local'
}

// État effectif du stockage, pour diagnostic (/api/health).
export async function storageStatus() {
  const { url, token } = redisVars()
  return {
    modeConfigured: storageMode(),
    backendEffectif: effectiveBackend || (await resolveBackend()),
    mysqlConfigured: !!(process.env.MYSQL_URL || process.env.MYSQL_HOST),
    mysqlError: mysqlError || null,
    redisConfigured: !!(url && token),
    redisUrl: !!url,
    redisToken: !!token,
    redisError: kvError || null,
  }
}
