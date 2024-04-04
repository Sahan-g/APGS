const express = require('express');
const router = express.Router();
const assignmentController= require('../../controllers/assignmentController')
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const upload= require('../../config/multer')



router.get('/:modulecode/:batch',assignmentController.getAssignments)
router.post('/:modulecode/:batch',upload.single('scheme'),assignmentController.HandleNewAssignment)
router.put('/:modulecode/:batch/scheme/:id',upload.single('scheme'),assignmentController.ChangeScheme)
router.put('/:modulecode/:batch/:id',upload.none(),assignmentController.Update)


module.exports= router;