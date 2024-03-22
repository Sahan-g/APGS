const express = require("express");
const router = express.Router();
const client = require("../databasepg.js");
//const verifyJWT = require("./middleware/verifyJWT");

const handleNewModule = async (req, res) => {
  try {
    const { modulecode, modulename, credits } = req.body;

    const duplicateModule = await client.query(
      "SELECT * FROM public.modules WHERE module name = $1",
      [modulename]
    );

    if (duplicateModule.rows.length > 0) {
      return res.sendStatus(409);
    }

    await client.query(
      `INSERT INTO public.modules (modulecode,modulename,credits)
       VALUES ($1, $2, $3)`,
      [modulecode, modulename, credits]
    );

    res.status(201).json({ success: `New module ${modulename} created!` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
//router.post("/", verifyJWT, handleNewModule);

//module.exports({ handleNewModule });
