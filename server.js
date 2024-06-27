const express = require('express');
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const bodyParser = require('body-parser');
const cloudinary= require('cloudinary')
const cloudinaryConfig=require('./config/cloudinary')
const PORT = process.env.PORT || 3500;
const upload = require('./config/multer');


const app = express();

app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// built-in middleware for json 
app.use(express.json());


app.use(cookieParser());

//serve static files
app.use('/', express.static(path.join(__dirname, '/public')));

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})




app.use('/' ,require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));


app.use(verifyJWT);

app.use('/modules',require('./routes/api/modules'))
app.use('/user',require('./routes/api/user'))
app.use('/batch',require('./routes/api/batch'))
app.use('/assignment',require('./routes/api/assignment'))
app.use('/answerscript',require('./routes/api/answerScripts'))
app.use('/report',require('./routes/api/report'))

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ "error": "404 Not Found" });
    } else {
        res.type('txt').send("404 Not Found");
    }
});

app.use(errorHandler);

app.listen(PORT,'0.0.0.0', () => console.log(`Server running on port ${PORT}`));

