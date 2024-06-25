const express = require('express');
const router = express.Router();
const modulesController = require('../../controllers/modulesController');
const Roles_list= require('../../config/roles_list')
const verifyRole = require('../../middleware/verifyRoles')
const upload= require('../../config/multer');
const { accessCheck } = require('../../middleware/accessCheck');


router.get('/',verifyRole(Roles_list.RolesList.user.toString()),upload.none(),modulesController.getModules );// working
router.post('/',verifyRole(Roles_list.RolesList.user.toString()),upload.none(),modulesController.AddModule)// working
//router.get('/:modulecode',verifyRole(Roles_list.RolesList.user.toString()),modulesController.GetModule)
router.route('/view/:modulecode').get(verifyRole(Roles_list.RolesList.user.toString()),upload.none(),modulesController.GetModule)//working
router.route('/view/:modulecode/user').post(verifyRole(Roles_list.RolesList.user.toString()),upload.none(),modulesController.AddtoModule)
router.route('/edit/:modulecode').post(verifyRole(Roles_list.RolesList.user.toString()),upload.none(),modulesController.EditModule)
router.route('/delete/:modulecode').delete(verifyRole(Roles_list.RolesList.user.toString()),upload.none(),modulesController.DeleteModule)


module.exports = router;




// CREATE TABLE IF NOT EXISTS public.assignments
// (
//     batch integer NOT NULL,
//     modulecode character varying(10) COLLATE pg_catalog."default" NOT NULL,
//     assignmenttitle character varying(100) COLLATE pg_catalog."default" NOT NULL,
//     assignmentid integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
//     assignmentdate date NOT NULL,
//     schemeid character varying COLLATE pg_catalog."default",
//     schemepath character varying COLLATE pg_catalog."default",
//     CONSTRAINT assignments_pkey PRIMARY KEY (batch, modulecode, assignmentid),
//     CONSTRAINT assignments_modulecode_fkey FOREIGN KEY (modulecode)
//         REFERENCES public.modules (modulecode) MATCH SIMPLE
//         ON UPDATE CASCADE
//         ON DELETE CASCADE
// )

// TABLESPACE pg_default;

// ALTER TABLE IF EXISTS public.assignments
//     OWNER to postgres;