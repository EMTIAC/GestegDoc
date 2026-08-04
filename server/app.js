import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { listTemplates, getTemplate, putTemplate, deleteTemplate, migrateLegacyTemplates, storageStatus } from './storage.js'
import { login, logout, sessionUser } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const COOKIE_NAME = 'sid'
const SESSION_MAX_AGE = 30 * 24 * 3600 * 1000 // 30 jours

function parseCookies(req) {
  const header = req.headers.cookie
  const out = {}
  if (header) {
    for (const part of header.split(';')) {
      const i = part.indexOf('=')
      if (i > -1) {
        try {
          out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
        } catch {
          /* cookie illisible : ignoré */
        }
      }
    }
  }
  return out
}

function cookieOptions(req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https'
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: SESSION_MAX_AGE }
}

function clearCookieOptions(req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https'
  return { httpOnly: true, sameSite: 'lax', secure, path: '/' }
}

function currentUser(req) {
  return sessionUser(parseCookies(req).sid)
}

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json({ limit: '2mb' }))

  // ————— Authentification —————
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {}
    const result = await login(email, password)
    if (!result) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    res.cookie(COOKIE_NAME, result.token, cookieOptions(req))
    // Migre d'éventuels gabarits de l'ancienne clé globale vers ce compte.
    await migrateLegacyTemplates(result.user.id)
    res.json({ user: result.user })
  })

  app.post('/api/auth/logout', async (req, res) => {
    await logout(parseCookies(req).sid)
    res.clearCookie(COOKIE_NAME, clearCookieOptions(req))
    res.json({ ok: true })
  })

  app.get('/api/auth/me', async (req, res) => {
    const user = await currentUser(req)
    if (!user) return res.status(401).json({ error: 'non connecté' })
    res.json({ user })
  })

  async function requireAuth(req, res, next) {
    const user = await currentUser(req)
    if (!user) return res.status(401).json({ error: 'Connexion requise' })
    req.user = user
    next()
  }

  // ————— Gabarits —————
  // Liste : réservée au propriétaire connecté.
  app.get('/api/templates', requireAuth, async (req, res) => {
    res.json(await listTemplates(req.user.id))
  })

  // Lecture par id : publique (liens de partage /print), via le miroir public.
  app.get('/api/templates/:id', async (req, res) => {
    const tpl = await getTemplate(req.params.id)
    if (tpl) res.json(tpl)
    else res.status(404).json({ error: 'template not found' })
  })

  app.put('/api/templates/:id', requireAuth, async (req, res) => {
    const id = req.params.id
    const body = req.body
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'invalid template' })
    res.json(await putTemplate(id, body, req.user.id))
  })

  app.delete('/api/templates/:id', requireAuth, async (req, res) => {
    res.json(await deleteTemplate(req.params.id, req.user.id))
  })

  app.post('/api/print', async (req, res) => {
    const { template, templateId, data, autoprint, toolbar, download, view } = req.body || {}
    let tpl = template || (await getTemplate(templateId))
    if (!tpl) return res.status(404).json({ error: 'template not found' })

    const id = tpl.meta?.id || templateId
    const dataParam = data ? Buffer.from(JSON.stringify(data)).toString('base64url') : ''
    const toolbarParam = toolbar === false || toolbar === 0 ? '&toolbar=0' : ''
    const downloadParam = download ? '&download=1' : ''
    const viewParam = view ? '&pdf=1' : ''
    const url = `/print?template=${encodeURIComponent(id)}&data=${dataParam}${downloadParam}${viewParam}${autoprint ? '&autoprint=1' : ''}${toolbarParam}`

    if (req.query.redirect === 'false') return res.json({ url })
    res.redirect(url)
  })

  app.get('/api/health', async (req, res) => {
    res.json(await storageStatus())
  })

  // ————— Proxy d'images —————
  // Relaie une image distante en la rendant lisible depuis la page d'impression :
  //   - contourne l'éventuelle protection anti-hotlinking (la requête serveur
  //     n'envoie aucun Referer) ;
  //   - ajoute Access-Control-Allow-Origin pour que l'image puisse être incluse
  //     dans le PDF (canvas non « tainted »).
  // Usage : /api/img?url=<url encodée>
  app.get('/api/img', async (req, res) => {
    const raw = req.query.url
    if (!raw || !/^https?:\/\//i.test(raw)) return res.status(400).json({ error: 'url invalide' })
    const up = new URL(raw)
    if (up.protocol !== 'http:' && up.protocol !== 'https:') {
      return res.status(400).json({ error: 'url invalide' })
    }
    try {
      const upstream = await fetch(up.href, { redirect: 'follow', signal: AbortSignal.timeout(20000) })
      if (!upstream.ok) return res.status(upstream.status).json({ error: 'upstream ' + upstream.status })
      const ct = upstream.headers.get('content-type') || 'application/octet-stream'
      const buffer = Buffer.from(await upstream.arrayBuffer())
      res.setHeader('Content-Type', ct)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.send(buffer)
    } catch (err) {
      res.status(502).json({ error: 'proxy error: ' + (err?.message || err) })
    }
  })

  // Sert le build statique (dist/) s'il existe + fallback SPA.
  // Plusieurs chemins candidats : en local, dist/ est à côté de server/ ; dans la
  // fonction Vercel (bundlée), __dirname et cwd() peuvent différer de l'emplacement
  // réel du build copié par includeFiles.
  const dist = [
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist'),
  ].find((dir) => fs.existsSync(path.join(dir, 'index.html')))
  if (dist) {
    app.use(express.static(dist))
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(dist, 'index.html'))
    })
  }

  // Erreurs : renvoyer du JSON détaillé (utile pour le diagnostic en prod),
  // jamais la page HTML "Internal Server Error" par défaut d'Express.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[api]', req.method, req.path, err?.stack || err)
    if (res.headersSent) return next(err)
    res.status(err.status || 500).json({ error: err?.message || 'Erreur interne' })
  })

  return app
}
