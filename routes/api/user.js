const express = require('express');
const router = express.Router();

const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const userController=require('../../controllers/userController')

const upload= require('../../config/multer')




//router.get('/',verifyRole(Roles_list.RolesList.user.toString(),Roles_list.RolesList.admin.toString()), userController.getuser)
router.get('/',verifyRole(Roles_list.RolesList.user.toString(),Roles_list.RolesList.admin.toString()),upload.single(),userController.getuser)
router.post('/',verifyRole(Roles_list.RolesList.admin.toString(),Roles_list.RolesList.user.toString()),upload.none(),userController.editUser)
router.post('/profile',verifyRole(Roles_list.RolesList.admin.toString(),Roles_list.RolesList.user.toString()),upload.single('image'),userController.AddProfilePicture)
router.put('/',verifyRole(Roles_list.RolesList.admin.toString(),Roles_list.RolesList.user.toString()),upload.none(),userController.changeEmail)
router.put('/password',verifyRole(Roles_list.RolesList.admin.toString(),Roles_list.RolesList.user.toString()),upload.none(),userController.cha)


module.exports= router;