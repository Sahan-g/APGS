
const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    

    //const foundUser = usersDB.users.find(person => person.refreshToken === refreshToken);
    const foundUsers = await client.query('SELECT email, refreshtoken FROM public.tokens WHERE refreshtoken = $1', [refreshToken]);
    const foundUser=foundUsers.rows[0];
    if (!foundUser) return res.sendStatus(403); //Forbidden 
 
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.email !== decoded.username) return res.sendStatus(403);
            const accessToken = jwt.sign(
                { "username": decoded.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '5m' }
            );
            res.json({ accessToken })
        }
    );
}

module.exports = { handleRefreshToken }