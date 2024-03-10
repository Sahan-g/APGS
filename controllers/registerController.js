const bcrypt = require('bcrypt');
const user = require('../model/user.js');
const client = require('../databasepg.js');


client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

const handleNewUser = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            designation
        } = req.body;

        console.log('Received request with the following data:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('First Name:', firstName);
        console.log('Last Name:', lastName);
        console.log('Designation:', designation);
        
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
