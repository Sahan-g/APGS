const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload= require('../config/multer')


router.post('/', upload.none(),authController.handleLogin);

module.exports = router;