const express = require('express');
const router = express.Router();
const answerScriptController = require('../../controllers/answerScriptController')
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const upload= require('../../config/multer');



router.get('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid',upload.none(),answerScriptController.getAnswerScripts)

router.post('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid',upload.array('scripts'),answerScriptController.uploadAnswerScripts)
router.post('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid/grade',upload.none(),answerScriptController.Grade)
router.get('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid/studentid/:studentid',upload.none(),answerScriptController.getGrade)
router.delete('/batch/:batch/modulecode/:modulecode/assignmentid/:assignmentid/fileid/:fileid',upload.none(),answerScriptController.removeFile)
module.exports =router;