// Création/réinitialisation de comptes (réservée à l'administrateur).
// Usage :
//   node server/scripts/add-user.js --email moi@exemple.fr --password 'secret' [--name "Nom"]
//   node server/scripts/add-user.js --email moi@exemple.fr --password 'nouveau' --reset
//
// Nécessite une base Redis configurée (STORAGE_KV_REST_API_URL + STORAGE_KV_REST_API_TOKEN
// ou UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
import { createUser, setUserPassword, findUserByEmail, requireRedis } from '../auth.js'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const dev = process.argv.includes('--dev')
  if (!dev) {
    try {
      requireRedis()
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  }

  const email = arg('email')
  const password = arg('password')
  const name = arg('name')
  const reset = process.argv.includes('--reset')

  if (!email || !password) {
    console.error('Usage : node server/scripts/add-user.js --email <email> --password <mot-de-passe> [--name "<nom>"] [--reset] [--dev]')
    process.exit(1)
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    if (reset) {
      const user = await setUserPassword(email, password)
      console.log(`Mot de passe réinitialisé pour ${user.email} (${user.name}).`)
      return
    }
    console.error(`Un compte existe déjà : ${email} — utilisez --reset pour réinitialiser le mot de passe.`)
    process.exit(1)
  }

  const user = await createUser({ email, password, name })
  console.log(`Compte créé : ${user.email} (${user.name}).`)
}

main().catch((err) => {
  console.error('Erreur :', err.message)
  process.exit(1)
})
