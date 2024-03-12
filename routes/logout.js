const express = require('express');
const router = express.Router();
const logoutController = require('../controllers/logoutController');
const upload=require('../config/multer')


router.get('/',upload.none(), logoutController.handleLogout);

module.exports = router;