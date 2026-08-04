import { createApp } from './app.js'
import { storageMode } from './storage.js'

const app = createApp()

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Serveur prêt : http://localhost:${PORT}`)
  console.log(`  Stockage : ${storageMode()}`)
})
