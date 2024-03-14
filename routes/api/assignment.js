const express = require('express');
const router = express.Router();
const assignmentController= require('../../controllers/assignmentController')
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const upload= require('../../config/multer')



router.get('/:modulecode/:batch',assignmentController.getAssignments)



module.exports= router;