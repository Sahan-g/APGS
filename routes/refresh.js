const express = require('express');
const router = express.Router();
const refreshTokenController = require('../controllers/refreshTokenController');
const upload= require('../config/multer')

router.get('/', upload.none(),refreshTokenController.handleRefreshToken);

module.exports = router;