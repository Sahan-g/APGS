const express = require('express');
const router = express.Router();
const modulesController = require('../../controllers/modulesController');
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')

router.get('/',verifyRole(Roles_list.RolesList.user.toString()),modulesController.getModules );
router.post('/',verifyRole(Roles_list.RolesList.user.toString()),modulesController.AddModule)
//router.get('/:modulecode',verifyRole(Roles_list.RolesList.user.toString()),modulesController.GetModule)
router.route('/:modulecode').get(verifyRole(Roles_list.RolesList.user.toString()),modulesController.GetModule)




module.exports = router;