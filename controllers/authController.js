
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');
const client = require('../databasepg.js');
const user = require('../model/user.js')





const handleLogin = async (req, res) => {

    const { userName, passWord } = req.body;
    if (!userName || ! passWord) return res.status(400).json({ 'message': 'Username and password are required.' });


    const foundUsers = await client.query('SELECT email, hashedpassword FROM public.users WHERE email = $1', [userName]);
    const foundUser=foundUsers.rows[0];
   

        if (foundUsers.rows.length === 0) {
            return res.sendStatus(401); // Unauthorized
        }

        const hashedPassword = foundUser.hashedpassword;
        const match = await bcrypt.compare( passWord,hashedPassword);
        
    if (match) {
        
        const accessToken = jwt.sign(
            { "username": foundUser.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '5m' }
        );
        const refreshToken = jwt.sign(
            { "username": foundUser.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );
        

        //client.query(`INSERT into public.tokens (email,refreshtoken) VALUES ($1,$2)`,[userName,refreshToken])
            

        // First, check if the email exists in the table
client.query('SELECT * FROM public.tokens WHERE email = $1', [userName], (err, result) => {
    if (err) {
        // Handle error
        console.error('Error executing SELECT query:', err);
        return;
    }

    
    if (result.rows.length > 0) {
        client.query('DELETE FROM public.tokens WHERE email = $1', [userName], (deleteErr, deleteResult) => {
            if (deleteErr) {
                
                console.error('Error executing DELETE query:', deleteErr);
                return;
            }

           
            executeInsertQuery();
        });
    } else {
        
        executeInsertQuery();
    }
});

        
        function executeInsertQuery() {
            client.query('INSERT INTO public.tokens (email, refreshtoken) VALUES ($1, $2)', [userName, refreshToken], (insertErr, insertResult) => {
            if (insertErr) {
            
            console.error('Error executing INSERT query:', insertErr);
            return;
        }

        
        
    });
}



        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };