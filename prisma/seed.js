const { PrismaClient } = require('@prisma/client')
const { v7: uuidv7 } = require('uuid')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const filePath = path.join(__dirname, 'seed_profiles.json')
  const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const data = json.profiles

  console.log(`Seeding ${data.length} profiles...`)

  // Supprimer les doublons du fichier JSON par nom
  const seen = new Set()
  const unique = data.filter(p => {
    if (seen.has(p.name)) return false
    seen.add(p.name)
    return true
  })

  // Insertion en masse
  await prisma.profile.createMany({
    data: unique.map(profile => ({
      id: profile.id ?? uuidv7(),
      name: profile.name,
      gender: profile.gender,
      gender_probability: profile.gender_probability,
      sample_size: profile.sample_size ?? 0,
      age: profile.age,
      age_group: profile.age_group,
      country_id: profile.country_id,
      country_name: profile.country_name ?? '',
      country_probability: profile.country_probability,
      created_at: profile.created_at ? new Date(profile.created_at) : new Date()
    })),
    skipDuplicates: true
  })

  console.log('Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())