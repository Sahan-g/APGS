const express = require("express");
const router = express.Router();
const modulesController = require("../../controllers/modulesController");
const Roles_list = require("../../config/roles_list");
const verifyRole = require("../../middleware/verifyRoles");
const upload = require("../../config/multer");

router.get(
  "/",
  verifyRole(Roles_list.RolesList.user.toString()),
  upload.none(),
  modulesController.getModules
);
router.post(
  "/",
  verifyRole(Roles_list.RolesList.user.toString()),
  upload.none(),
  modulesController.AddModule
);
//router.get('/:modulecode',verifyRole(Roles_list.RolesList.user.toString()),modulesController.GetModule)
router
  .route("/view/:modulecode")
  .get(
    verifyRole(Roles_list.RolesList.user.toString()),
    upload.none(),
    modulesController.GetModule
  );
router
  .route("/edit/:modulecode")
  .post(
    verifyRole(Roles_list.RolesList.user.toString()),
    upload.none(),
    modulesController.EditModule
  );
router
  .route("/delete/:modulecode")
  .delete(
    verifyRole(Roles_list.RolesList.user.toString()),
    upload.none(),
    modulesController.DeleteModule
  );

module.exports = router;
