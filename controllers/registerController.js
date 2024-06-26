const bcrypt = require('bcrypt');
const user = require('../model/user.js');
const client = require('../databasepg.js');

try{
     
    client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));
}catch(e){
    console.log('Database connection lost reconecting ... ')
}
    
const handleNewUser = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            designation,
            image
        } = req.body;
        
        
    
        
        if (!email || !password || !firstName || !lastName || !designation) {
            return res.status(400).json({ 'message': 'All fields are required' });
        }

        
        const duplicate = await client.query('SELECT * FROM public.users WHERE email = $1', [email]);
        if (duplicate.rows.length > 0) {
            return res.sendStatus(409); // Conflict
        }

     
        const hashedPassword = await bcrypt.hash(password, 10);

       
        await client.query(
            `INSERT INTO public.users (email, hashedpassword, firstname, lastname, designation)
             VALUES ($1, $2, $3, $4, $5)`,
            [email, hashedPassword, firstName, lastName, designation]
        );

        res.status(201).json({ 'success': `New user ${email} created!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 'message': err.message });
    }
};

module.exports = { handleNewUser };
