const client = require('../databasepg.js');



const handleLogout = async (req, res) => {
    
    
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); 
    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    const foundUsers = await client.query('SELECT email, refreshtoken FROM public.tokens WHERE refreshtoken = $1', [refreshToken]);
    const foundUser=foundUsers.rows[0];
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    client.query('DELETE * from public.tokens where refreshtoken=$1',[refreshToken])
   
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.sendStatus(204);
}

module.exports = { handleLogout }