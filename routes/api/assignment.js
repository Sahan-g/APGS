const express = require('express');
const router = express.Router();
const modulesController = require('../../controllers/modulesController');
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const upload= require('../../config/multer')



router.get()