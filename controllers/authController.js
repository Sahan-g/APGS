const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises;
const path = require("path");
const client = require("../databasepg.js");
const user = require("../model/user.js");
const cors = require("cors");
const user = require("../model/user.js");
const Cookies = require("js-cookie");

const handleLogin = async (req, res) => {
  const { userName, passWord } = req.body;
  if (!userName || !passWord)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  const foundUser = await client.query(
    "SELECT email, hashedpassword FROM public.users WHERE email = $1",
    [userName]
  );

  if (foundUser.rows.length === 0) {
    return res.sendStatus(401); // Unauthorized
  }

  const hashedPassword = foundUser.rows[0].hashedpassword;
  const match = await bcrypt.compare(passWord, hashedPassword);
  if (match) {
    const accessToken = jwt.sign(
      { username: foundUser.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    // Saving refreshToken with current user
    // const otherUsers = usersDB.users.filter(person => person.username !== foundUser.username);
    // const currentUser = { ...foundUser, refreshToken };
    // usersDB.setUsers([...otherUsers, currentUser]);
    // await fsPromises.writeFile(
    //     path.join(__dirname, '..', 'model', 'users.json'),
    //     JSON.stringify(usersDB.users)
    // );

    client.query(
      `INSERT into public.tokens (email,accesstoken,refreshtoken) VALUES ($1,$2,$3)`,
      [userName, accessToken, refreshToken]
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
