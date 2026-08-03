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
let kv = null
let kvMode = false

try {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (url && token) {
    const { Redis } = await import('@upstash/redis')
    kv = new Redis({ url, token })
    kvMode = true
  }
} catch {
  console.warn('[storage] @upstash/redis indisponible, bascule sur le stockage fichier local')
  kv = null
  kvMode = false
}

async function readRedisStore() {
  try {
    const raw = await kv.get(STORE_KEY)
    if (!raw) return {}
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return {}
  }
}

async function writeRedisStore(store) {
  await kv.set(STORE_KEY, store)
}

// ————— Backend MySQL (base externe, compatible Vercel) —————
let pool = null
let mysqlMode = false
let mysqlReady = null

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

try {
  if (process.env.MYSQL_URL || process.env.MYSQL_HOST) {
    const { default: mysql } = await import('mysql2/promise')
    pool = mysql.createPool(mysqlPoolConfig())
    mysqlMode = true
  }
} catch {
  console.warn('[storage] mysql2 indisponible, bascule sur un autre backend')
  pool = null
  mysqlMode = false
}

// Schéma minimal + « migrations » idempotentes, exécutées au démarrage du serveur.
// Aucune commande manuelle n'est nécessaire : pour faire évoluer le schéma, ajoutez
// ici des instructions ALTER TABLE idempotentes (voir README, section « Stockage »).
function ensureMysqlTable() {
  if (!mysqlMode) return Promise.resolve()
  if (mysqlReady) return mysqlReady
  mysqlReady = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    // Exemple d'évolution de schéma (à ajouter si besoin, sans risque de relancer) :
    // await pool.query(`ALTER TABLE templates ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'template'`)
  })()
  return mysqlReady
}

async function readMysqlStore() {
  await ensureMysqlTable()
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

// ————— API unifiée —————
// Priorité des backends : MySQL > Redis > fichier local.
export async function listTemplates() {
  if (mysqlMode) return Object.values(await readMysqlStore())
  if (kvMode) return Object.values(await readRedisStore())
  return Object.values(readFileStore())
}

export async function getTemplate(id) {
  if (mysqlMode) {
    await ensureMysqlTable()
    const [rows] = await pool.query('SELECT data FROM templates WHERE id = ?', [id])
    if (!rows.length) return null
    try {
      return JSON.parse(rows[0].data)
    } catch {
      return null
    }
  }
  if (kvMode) return (await readRedisStore())[id] || null
  return readFileStore()[id] || null
}

export async function putTemplate(id, body) {
  if (mysqlMode) {
    await ensureMysqlTable()
    const tpl = { ...body, meta: { ...(body.meta || {}), id } }
    const name = tpl.meta?.name || ''
    await pool.query(
      'INSERT INTO templates (id, name, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), data = VALUES(data), updated_at = NOW()',
      [id, name, JSON.stringify(tpl)]
    )
    return { ok: true, id }
  }
  if (kvMode) {
    const store = await readRedisStore()
    store[id] = { ...body, meta: { ...(body.meta || {}), id } }
    await writeRedisStore(store)
    return { ok: true, id }
  }
  const store = readFileStore()
  store[id] = { ...body, meta: { ...(body.meta || {}), id } }
  writeFileStore(store)
  return { ok: true, id }
}

export async function deleteTemplate(id) {
  if (mysqlMode) {
    await ensureMysqlTable()
    await pool.query('DELETE FROM templates WHERE id = ?', [id])
    return { ok: true }
  }
  if (kvMode) {
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
  if (mysqlMode) return 'mysql (base externe)'
  if (kvMode) return 'redis (Upstash / Vercel integration)'
  return 'fichier local'
}
