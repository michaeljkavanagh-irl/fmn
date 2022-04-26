const express = require('express');
const bodyParser = require('body-parser');
const mongoRoutes = require('./routes/mongostore');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
mongoose.connect('mongodb+srv://mk:admin@cluster0.rtrla.mongodb.net/testmk1?retryWrites=true&w=majority')
.then(() => {
    console.log('Connected to the database!')
})
.catch(() => {
    console.log('Connection failed');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * Set config for CORS
 */
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
    next();
});


app.use("/api/data", mongoRoutes);

/**
 * This is a basic test GET route.
 */
app.get('/api/data', (req, res, next) => {
    const data = [
        { id: 'OC1', dataname: '15min Neighbourhood', content: 'FMN Server open for biz...'}
    ]
    res.status(200).json({
        message:'Data fetched successfully',
        data:data
    });
});


module.exports = app;