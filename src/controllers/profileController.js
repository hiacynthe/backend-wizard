const { PrismaClient } = require('@prisma/client')
const { fetchAllData } = require('../services/externalApis')
const { v7: uuidv7 } = require('uuid')

const prisma = new PrismaClient()

// POST /api/profiles
async function createProfile(req, res) {
  const { name } = req.body

  if (name === undefined || name === null || name === '') {
    return res.status(400).json({ status: 'error', message: 'Missing or empty name' })
  }
  if (typeof name !== 'string') {
    return res.status(422).json({ status: 'error', message: 'Invalid type' })
  }
  if (name.trim() === '') {
    return res.status(400).json({ status: 'error', message: 'Missing or empty name' })
  }

  const cleanName = name.trim().toLowerCase()

  const existing = await prisma.profile.findUnique({ where: { name: cleanName } })
  if (existing) {
    return res.status(200).json({
      status: 'success',
      message: 'Profile already exists',
      data: existing
    })
  }

  try {
    const apiData = await fetchAllData(cleanName)
    const profile = await prisma.profile.create({
      data: { id: uuidv7(), name: cleanName, ...apiData, country_name: '' }
    })
    return res.status(201).json({ status: 'success', data: profile })
  } catch (err) {
    if (err.code === 502) {
      return res.status(502).json({
        status: 'error',
        message: `${err.api} returned an invalid response`
      })
    }
    return res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
}

// GET /api/profiles/:id
async function getProfile(req, res) {
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id } })
  if (!profile)
    return res.status(404).json({ status: 'error', message: 'Profile not found' })
  return res.status(200).json({ status: 'success', data: profile })
}

// GET /api/profiles
async function getAllProfiles(req, res) {
  const {
    gender, country_id, age_group,
    min_age, max_age,
    min_gender_probability, min_country_probability,
    sort_by, order,
    page, limit
  } = req.query

  // Validation des paramètres
  const validSortBy = ['age', 'created_at', 'gender_probability']
  const validOrder = ['asc', 'desc']

  if (sort_by && !validSortBy.includes(sort_by)) {
    return res.status(400).json({ status: 'error', message: 'Invalid query parameters' })
  }
  if (order && !validOrder.includes(order)) {
    return res.status(400).json({ status: 'error', message: 'Invalid query parameters' })
  }

  // Filtres
  const filters = {}
  if (gender) filters.gender = gender.toLowerCase()
  if (country_id) filters.country_id = country_id.toUpperCase()
  if (age_group) filters.age_group = age_group.toLowerCase()
  if (min_age || max_age) {
    filters.age = {}
    if (min_age) filters.age.gte = parseInt(min_age)
    if (max_age) filters.age.lte = parseInt(max_age)
  }
  if (min_gender_probability) {
    filters.gender_probability = { gte: parseFloat(min_gender_probability) }
  }
  if (min_country_probability) {
    filters.country_probability = { gte: parseFloat(min_country_probability) }
  }

  // Pagination
  const pageNum = parseInt(page) || 1
  const limitNum = Math.min(parseInt(limit) || 10, 50)
  const skip = (pageNum - 1) * limitNum

  // Tri
  const orderBy = {}
  orderBy[sort_by || 'created_at'] = order || 'desc'

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where: filters,
      orderBy,
      skip,
      take: limitNum
    }),
    prisma.profile.count({ where: filters })
  ])

  return res.status(200).json({
    status: 'success',
    page: pageNum,
    limit: limitNum,
    total,
    data: profiles
  })
}

// GET /api/profiles/search
async function searchProfiles(req, res) {
  const { q, page, limit } = req.query

  if (!q || q.trim() === '') {
    return res.status(400).json({ status: 'error', message: 'Missing or empty parameter' })
  }

  const query = q.toLowerCase().trim()
  const filters = {}

  // Parsing genre
  if (query.includes('male') && !query.includes('female')) filters.gender = 'male'
  if (query.includes('female')) filters.gender = 'female'

  // Parsing age_group
  if (query.includes('child')) filters.age_group = 'child'
  if (query.includes('teenager') || query.includes('teenagers')) filters.age_group = 'teenager'
  if (query.includes('adult') || query.includes('adults')) filters.age_group = 'adult'
  if (query.includes('senior') || query.includes('seniors')) filters.age_group = 'senior'

  // Parsing "young" → ages 16-24
  if (query.includes('young')) {
    filters.age = { gte: 16, lte: 24 }
  }

  // Parsing ages "above X" / "over X" / "under X" / "below X"
  const aboveMatch = query.match(/(?:above|over)\s+(\d+)/)
  const belowMatch = query.match(/(?:under|below)\s+(\d+)/)
  if (aboveMatch) {
    filters.age = { ...filters.age, gte: parseInt(aboveMatch[1]) }
  }
  if (belowMatch) {
    filters.age = { ...filters.age, lte: parseInt(belowMatch[1]) }
  }

  // Parsing pays
  const countryMap = {
    'nigeria': 'NG', 'ghana': 'GH', 'kenya': 'KE', 'angola': 'AO',
    'cameroon': 'CM', 'ethiopia': 'ET', 'tanzania': 'TZ', 'uganda': 'UG',
    'senegal': 'SN', 'mali': 'ML', 'benin': 'BJ', 'togo': 'TG',
    'ivory coast': 'CI', 'south africa': 'ZA', 'egypt': 'EG',
    'morocco': 'MA', 'algeria': 'DZ', 'tunisia': 'TN', 'libya': 'LY',
    'france': 'FR', 'usa': 'US', 'united states': 'US', 'uk': 'GB',
    'united kingdom': 'GB', 'canada': 'CA', 'brazil': 'BR', 'india': 'IN',
    'china': 'CN', 'japan': 'JP', 'germany': 'DE', 'italy': 'IT',
    'spain': 'ES', 'portugal': 'PT', 'mexico': 'MX', 'argentina': 'AR'
  }

  for (const [countryName, code] of Object.entries(countryMap)) {
    if (query.includes(countryName)) {
      filters.country_id = code
      break
    }
  }

  // Si aucun filtre trouvé
  if (Object.keys(filters).length === 0) {
    return res.status(400).json({ status: 'error', message: 'Unable to interpret query' })
  }

  // Pagination
  const pageNum = parseInt(page) || 1
  const limitNum = Math.min(parseInt(limit) || 10, 50)
  const skip = (pageNum - 1) * limitNum

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where: filters,
      skip,
      take: limitNum
    }),
    prisma.profile.count({ where: filters })
  ])

  return res.status(200).json({
    status: 'success',
    page: pageNum,
    limit: limitNum,
    total,
    data: profiles
  })
}

// DELETE /api/profiles/:id
async function deleteProfile(req, res) {
  const profile = await prisma.profile.findUnique({ where: { id: req.params.id } })
  if (!profile)
    return res.status(404).json({ status: 'error', message: 'Profile not found' })
  await prisma.profile.delete({ where: { id: req.params.id } })
  return res.status(204).send()
}

module.exports = { createProfile, getProfile, getAllProfiles, searchProfiles, deleteProfile }