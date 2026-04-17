const { PrismaClient } = require('@prisma/client')
const { fetchAllData } = require('../services/externalApis')
const { v7: uuidv7 } = require('uuid')

const prisma = new PrismaClient()

// POST /api/profiles
async function createProfile(req, res) {
  const { name } = req.body

  if (!name || typeof name !== 'string' || name.trim() === '') {
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
      data: { id: uuidv7(), name: cleanName, ...apiData }
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
  const { gender, country_id, age_group } = req.query
  const filters = {}
  if (gender) filters.gender = gender.toLowerCase()
  if (country_id) filters.country_id = country_id.toUpperCase()
  if (age_group) filters.age_group = age_group.toLowerCase()

  const profiles = await prisma.profile.findMany({ where: filters })
  return res.status(200).json({
    status: 'success',
    count: profiles.length,
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

module.exports = { createProfile, getProfile, getAllProfiles, deleteProfile }