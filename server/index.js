import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { listTemplates, getTemplate, putTemplate, deleteTemplate, storageMode } from './storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '2mb' }))

app.get('/api/templates', async (req, res) => {
  res.json(await listTemplates())
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

const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Serveur prêt : http://localhost:${PORT}`)
  console.log(`  Stockage : ${storageMode()}`)
  if (!fs.existsSync(dist)) {
    console.log(`  (dossier dist introuvable — lancez d'abord « npm run build » pour servir l'interface)`)
  }
})
