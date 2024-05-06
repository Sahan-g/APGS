const express = require('express');
const router = express.Router();
const answerScriptController = require('../../controllers/answerScriptController')
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const upload= require('../../config/multer')


router.get('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid',upload.none(),answerScriptController.getAnswerScripts)

router.post('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid',upload.array('scripts'),answerScriptController.uploadAnswerScripts)


module.exports =router;