import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { listTemplates, getTemplate, putTemplate, deleteTemplate, storageStatus } from './storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()
  app.use(express.json({ limit: '2mb' }))

  app.get('/api/templates', async (req, res) => {
    res.json(await listTemplates())
  })

  app.get('/api/health', async (req, res) => {
    res.json(await storageStatus())
  })

  app.get('/api/templates/:id', async (req, res) => {
    const tpl = await getTemplate(req.params.id)
    if (tpl) res.json(tpl)
    else res.status(404).json({ error: 'template not found' })
  })

  app.put('/api/templates/:id', async (req, res) => {
    const id = req.params.id
    const body = req.body
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'invalid template' })
    res.json(await putTemplate(id, body))
  })

  app.delete('/api/templates/:id', async (req, res) => {
    res.json(await deleteTemplate(req.params.id))
  })

  app.post('/api/print', async (req, res) => {
    const { template, templateId, data, autoprint } = req.body || {}
    let tpl = template || (await getTemplate(templateId))
    if (!tpl) return res.status(404).json({ error: 'template not found' })

    const id = tpl.meta?.id || templateId
    const dataParam = data ? Buffer.from(JSON.stringify(data)).toString('base64url') : ''
    const url = `/print?template=${encodeURIComponent(id)}&data=${dataParam}${autoprint ? '&autoprint=1' : ''}`

    if (req.query.redirect === 'false') return res.json({ url })
    res.redirect(url)
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
