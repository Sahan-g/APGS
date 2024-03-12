
const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('../databasepg.js');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    

    //const foundUser = usersDB.users.find(person => person.refreshToken === refreshToken);
    const foundUsers = await client.query('SELECT t.email, t.refreshtoken  FROM public.tokens AS t JOIN public.users AS u ON t.email = u.email WHERE t.refreshtoken = $1;', [refreshToken]);
    const foundUser=foundUsers.rows[0];
    if (!foundUser) return res.sendStatus(403); //Forbidden 
    var role;
   if(foundUser.isadmin){
    role='1'
   }else role='0';
 console.log(role);
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.email !== decoded.username) return res.sendStatus(403);
            const accessToken = jwt.sign(
                {

                  "Userinfo":  { "username": decoded.username,
                  "role": role
                 }, 
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '25m' }
            );
            res.json({ accessToken })
        }
    );
}

module.exports = { handleRefreshToken }