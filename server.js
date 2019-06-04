var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var path = require('path');
require('dotenv').config();
var Sequelize = require('sequelize');

const sequelize = new Sequelize('TestDB', 'sa', 'reallyStrongPwd123', {
    host: 'localhost',
    port: 1433,
    dialect: 'mssql',
    dialectOptions:{
        encrypt: true
    },
    operatorsAliases: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

sequelize.authenticate().then(() => {
    console.log('Connection established successfully')
}).catch((err) => {
    console.log(err);
})

var app=express();
var port = process.env.PORT;

app.use(bodyParser.urlencoded({
    extended:true,
    limit:'50mb'
}));
app.use(bodyParser.json({
    limit:'50mb'
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('X-HTTP-Method-Override'));

var models = require('./models/Models')(sequelize,Sequelize);
require('./routes/ApiRoutes')(app,models);

app.listen(port,function(){
    console.log('Application started at PORT '+port);
});

Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
    date = this._applyTimezone(date, options);
    return date.format('YYYY-MM-DD HH:mm:ss.SSS');
};

exports = module.exports = app;