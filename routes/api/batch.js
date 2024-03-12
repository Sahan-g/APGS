const express = require('express');
const router = express.Router();

const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const batchController= require('../../controllers/batchController')
const upload= require('../../config/multer')

router.get('/:modulecode',verifyRole(Roles_list.RolesList.user.toString()),upload.none(),batchController.GetBatches)
router.post('/:modulecode',verifyRole(Roles_list.RolesList.user.toString()),upload.none(),batchController.AddBatch)




module.exports=router;