import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { kvGet, kvSet, kvDel, kvReady } from './storage.js'

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 jours

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

// ————— Mot de passe (scrypt natif, salé) —————
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  try {
    const candidate = scryptSync(String(password), salt, 64)
    const expected = Buffer.from(hash, 'hex')
    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  } catch {
    return false
  }
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

// ————— Utilisateurs —————
export async function findUserByEmail(email) {
  const raw = await kvGet(`user:email:${normalizeEmail(email)}`)
  return raw ? JSON.parse(raw) : null
}

export async function findUserById(id) {
  if (!id) return null
  const raw = await kvGet(`user:id:${id}`)
  return raw ? JSON.parse(raw) : null
}

// Création de compte — réservée à l'admin (script npm run adduser).
export async function createUser({ name, email, password }) {
  const norm = normalizeEmail(email)
  if (!norm || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(norm)) throw new Error('Email invalide')
  if (!password || String(password).length < 6) throw new Error('Mot de passe trop court (min. 6 caractères)')
  if (await findUserByEmail(norm)) throw new Error(`Un compte existe déjà : ${norm}`)
  const user = {
    id: randomBytes(12).toString('hex'),
    name: String(name || '').trim() || norm.split('@')[0],
    email: norm,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  await kvSet(`user:email:${norm}`, JSON.stringify(user))
  await kvSet(`user:id:${user.id}`, JSON.stringify(user))
  return publicUser(user)
}

export async function setUserPassword(email, password) {
  if (!password || String(password).length < 6) throw new Error('Mot de passe trop court (min. 6 caractères)')
  const user = await findUserByEmail(email)
  if (!user) throw new Error(`Aucun compte pour : ${email}`)
  user.password = hashPassword(password)
  await kvSet(`user:email:${user.email}`, JSON.stringify(user))
  await kvSet(`user:id:${user.id}`, JSON.stringify(user))
  return publicUser(user)
}

// ————— Sessions —————
export async function login(email, password) {
  const user = await findUserByEmail(email)
  if (!user || !verifyPassword(password, user.password)) return null
  const token = randomBytes(32).toString('hex')
  await kvSet(`session:${token}`, user.id, SESSION_TTL_SECONDS)
  return { token, user: publicUser(user) }
}

export async function logout(token) {
  if (token) await kvDel(`session:${token}`)
}

export async function sessionUser(token) {
  if (!token) return null
  const userId = await kvGet(`session:${token}`)
  if (!userId) return null
  const user = await findUserById(userId)
  return user ? publicUser(user) : null
}

// Vérification avant création de compte par l'admin.
export function requireRedis() {
  if (!kvReady()) {
    throw new Error(
      'Aucune base Redis configurée. Définissez STORAGE_KV_REST_API_URL et STORAGE_KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN) pour pouvoir créer les comptes.'
    )
  }
}
