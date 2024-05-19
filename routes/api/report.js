const express = require('express');
const router = express.Router();

const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const reportController= require('../../controllers/reportController')
const upload= require('../../config/multer')



router.get('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid',upload.none(),reportController.getData)


module.exports= router;