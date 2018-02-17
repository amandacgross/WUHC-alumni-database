var express = require('express');
var router = express.Router();
var path = require('path');
var vogels = require('vogels');
var Joi = require('joi');

//
// Set up connection to AWS
//
vogels.AWS.config.update({ region: "us-east-1"});

/*
// Connect string to MySQL
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'fling.seas.upenn.edu',
  user     : 'pennkey',
  password : 'password',
  database : 'pennkey'
}); */

var Alumni = vogels.define('Alumni', {
  hashKey : 'aID',

  // add the timestamp attributes (updatedAt, createdAt)
  timestamps : false,

  schema : {
  	aID 	: Joi.number(),
    firstName   : Joi.string(),
    gradYear    : Joi.number(),
    industry     : Joi.string(),
    lastName   : Joi.string(),
    location	: Joi.string(),
    organization	: Joi.string(),
    school	: Joi.string()
  }
});

var printResults = function (err, resp) {
  console.log('----------------------------------------------------------------------');
  if(err) {
    console.log('Error running scan', err);
  } else {
    console.log('Found', resp.Count, 'items');
    console.log(util.inspect(_.pluck(resp.Items, 'attrs')));

    if(resp.ConsumedCapacity) {
      console.log('----------------------------------------------------------------------');
      console.log('Scan consumed: ', resp.ConsumedCapacity);
    }
  }

  console.log('----------------------------------------------------------------------');
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'login.html'));
});

router.get('/requestPassword', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'requestPassword.html'));
});

// TODO:implement password checking and redirection
router.get('/checkPassword', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'insert.html'));

});

router.get('/reference', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'reference.html'));
});

router.get('/insert', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'insert.html'));
});

router.get('/profile', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'profile.html'));
});


router.get('/lookup', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'lookup.html'));
});

router.get('/data', function(req,res) {
	console.log('here');
	Account.scan().exec(printResults);
});

router.get('/data/:email', function(req,res) {
  // use console.log() as print() in case you want to debug, example below:
   console.log("inside person email");
  var query = 'SELECT * from Person';
  var email = req.params.email;
  if (email != 'undefined') query = query + ' where login ="' + email + '"' ;
  console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (err) console.log(err);
    else {
        res.json(rows);
    }  
    });
});

router.get('/insert/:values', function(req,res) {
 var value = req.params.values.split('&');
    //console.log('INSERT INTO Person(login,name,sex,relationshipStatus,birthyear) VALUES("'+value[0]+'","'+value[1]+'","'+value[2]+'","'+value[3]+'","'+value[4]+'")');
    connection.query('INSERT INTO Person(login,name,sex,relationshipStatus,birthyear) VALUES("'+value[0]+'","'+value[1]+'","'+value[2]+'","'+value[3]+'","'+value[4]+'")' ,function (err, rows, fields) {
        if (err) throw err;

    });
});


module.exports = router;