const express = require('express');
const router = express.Router();
const { getCreators, getCreatorProfile } = require('../controllers/creatorController');

router.get('/', getCreators);
router.get('/:id/profile', getCreatorProfile);

module.exports = router;
