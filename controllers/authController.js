<<<<<<< HEAD
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises;
const path = require("path");
const client = require("../databasepg.js");
const user = require("../model/user.js");
const cors = require("cors");
const Cookies = require("js-cookie");
=======

const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');
const client = require('../databasepg.js');
const user = require('../model/user.js');
const Cookies = require('js-cookie');




>>>>>>> origin/auth_branch

const handleLogin = async (req, res) => {
  const { userName, passWord } = req.body;

<<<<<<< HEAD
  if (!userName || !passWord)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  console.log(typeof userName);

  const foundUsers = await client.query(
    "SELECT email, hashedpassword, isadmin FROM public.users WHERE email = $1",
    [userName]
  );
  const foundUser = foundUsers.rows[0];
=======
    const { userName, passWord } = req.body;
    
    if (!userName || ! passWord) return res.status(400).json({ 'message': 'Username and password are required.' });

    console.log(typeof(userName))
    
    const foundUsers = await client.query('SELECT email, hashedpassword, isadmin FROM public.users WHERE email = $1', [userName]);
    const foundUser=foundUsers.rows[0];
    console.log(foundUser)
>>>>>>> origin/auth_branch

  if (foundUsers.rows.length === 0) {
    return res.sendStatus(401); // Unauthorized
  }
  if (foundUser.rows.length === 0) {
    return res.sendStatus(401); // Unauthorized
  }

  const hashedPassword = foundUser.hashedpassword;
  const match = await bcrypt.compare(passWord, hashedPassword);

  if (match) {
    var role;
    if (foundUser.isadmin) {
      role = "1";
    } else role = "0";

    const accessToken = jwt.sign(
      {
        Userinfo: { username: foundUser.email, role: role },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "20m" }
    );
    const refreshToken = jwt.sign(
      { username: foundUser.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    //client.query(`INSERT into public.tokens (email,refreshtoken) VALUES ($1,$2)`,[userName,refreshToken])

    client.query(
      "SELECT * FROM public.tokens WHERE email = $1",
      [userName],
      (err, result) => {
        if (err) {
          console.error("Error executing SELECT query:", err);
          return;
        }

<<<<<<< HEAD
        if (result.rows.length > 0) {
          client.query(
            "DELETE FROM public.tokens WHERE email = $1",
            [userName],
            (deleteErr, deleteResult) => {
              if (deleteErr) {
                console.error("Error executing DELETE query:", deleteErr);
=======
        const hashedPassword = foundUser.hashedpassword;
        const match = await bcrypt.compare( passWord,hashedPassword);
        
    if (match) {
        
       
        var role;
        if(foundUser.isadmin){
            role='1'
        }else role='0';
        
        const accessToken = jwt.sign(
            
            {
               "Userinfo": { "username": foundUser.email 
               ,"role":role
               
            }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '60s' }
        )
        const refreshToken = jwt.sign(
            { "username": foundUser.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        )
        // localStorage.setItem('accessToken', accessToken);
        // res.cookie('accessToken', accessToken, {maxAge: 60000})
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 })
        // localStorage.setItem('accessToken', accessToken);
        res.json({ accessToken });
        // Cookies.set('accessToken', accessToken, { expires: 7, secure: true });
        // Cookies.set('refreshToken', refreshToken, { expires: 7, secure: true });
        

        //client.query(`INSERT into public.tokens (email,refreshtoken) VALUES ($1,$2)`,[userName,refreshToken])
            

client.query('SELECT * FROM public.tokens WHERE email = $1', [userName], (err, result) => {
    if (err) {
       
        console.error('Error executing SELECT query:', err);
        return;
    }

    
    if (result.rows.length > 0) {
        client.query('DELETE FROM public.tokens WHERE email = $1', [userName], (deleteErr, deleteResult) => {
            if (deleteErr) {
                
                console.error('Error executing DELETE query:', deleteErr);
>>>>>>> origin/auth_branch
                return;
              }

              executeInsertQuery();
            }
          );
        } else {
          executeInsertQuery();
        }
      }
    );

<<<<<<< HEAD
    function executeInsertQuery() {
      client.query(
        "INSERT INTO public.tokens (email, refreshtoken) VALUES ($1, $2)",
        [userName, refreshToken],
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error executing INSERT query:", insertErr);
            return;
          }
        }
      );
=======
        
        
    });
}


        
    } else {
        res.sendStatus(401);
>>>>>>> origin/auth_branch
    }

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
