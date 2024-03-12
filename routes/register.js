const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const upload= require('../config/multer')



router.post('/', upload.none(),registerController.handleNewUser);

module.exports = router;