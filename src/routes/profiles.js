const express = require('express');
const router = express.Router();
const {
  createProfile, getProfile, getAllProfiles, deleteProfile
} = require('../controllers/profileController');

router.post('/', createProfile);
router.get('/', getAllProfiles);
router.get('/:id', getProfile);
router.delete('/:id', deleteProfile);

module.exports = router;