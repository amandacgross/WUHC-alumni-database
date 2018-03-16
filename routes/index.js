var express = require('express');
var router = express.Router();
var path = require('path');
var vogels = require('vogels');
var util   = require('util');
var _      = require('lodash');
var Joi = require('joi');
var fs = require('fs');

//
// Set up connection to AWS
//
//var access=JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'public','javascripts', 'access.json'), 'utf8'));
console.log('hello ' + process.env.accessKeyId);
vogels.AWS.config.update({accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey,
 region: "us-east-1"});

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

var alumniMap = new Map();

Alumni.config({tableName : 'Alumni'});

var fetchedTable;
var checkValidLogin = require('../middlewares/passwordCheck');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'login.html'));
});

router.get('/requestPassword', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'requestPassword.html'));
});

router.post('/checkPassword', function (req, res, next) {
  console.log("checking password");
  // DUMMY: update to a potential function or just change the string to desired password, potential hash and store in db
  if (req.body.password === 'password') {
    req.session.isAuthenticated = true;
    res.redirect('lookup');
  } else {
    res.redirect('/')
  }
});

router.post('/logout', function(req, res, next) {
  req.session.isAuthenticated = false;
  res.redirect('/');
})

// ? when is this used 
router.get('/reference', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'reference.html'));
});

router.get('/insert', function(req, res, next) {
  if(req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, '../', 'views', 'insert.html'));
  } else {
    res.redirect('/');
  }

});

router.get('/profile', function(req, res, next) {
   if(req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, '../', 'views', 'profile.html'));
  } else {
    res.redirect('/');
  }
});


router.get('/lookup', function(req, res, next) {
  if(req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, '../', 'views', 'lookup.html'));
    //res.sendFile(path.join(__dirname, '../', 'views', 'temp.html'));
  } else {
    res.redirect('/');
  }
});

router.get('/saved', function(req, res, next) {
  if(req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, '../', 'views', 'saved.html'));
  } else {
    res.redirect('/');
  }
})

router.get('/data', function(req,res) {
	Alumni.scan().exec(function(err, resp) {
    console.log('----------------------------------------------------------------------');
    if(err) {
      console.log('Error running scan', err);
    } else {
      console.log('Found', resp.Count, 'items');
      fetchedTable = resp.Items;
      var i=0;
      for (row in fetchedTable) {
        var id = fetchedTable[i].attrs.aID;
        var contents = fetchedTable[i].attrs;
        console.log(fetchedTable[i].attrs);
        i++;
        alumniMap.set(id, contents);
      }
      res.json(resp);
      if(resp.ConsumedCapacity) {
       console.log('----------------------------------------------------------------------');
       console.log('Scan consumed: ', resp.ConsumedCapacity);
     }
   }

   console.log('----------------------------------------------------------------------');
 });
	//res.json(data);
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

router.get('/data/show/profile/:aid', function(req,res) {
  var aid = req.params.aid;
  res.json(alumniMap.get(parseInt(aid)));
});

router.get('/insert/:values', function(req,res) {
 var value = req.params.values.split('&');
    //console.log('INSERT INTO Person(login,name,sex,relationshipStatus,birthyear) VALUES("'+value[0]+'","'+value[1]+'","'+value[2]+'","'+value[3]+'","'+value[4]+'")');
    connection.query('INSERT INTO Person(login,name,sex,relationshipStatus,birthyear) VALUES("'+value[0]+'","'+value[1]+'","'+value[2]+'","'+value[3]+'","'+value[4]+'")' ,function (err, rows, fields) {
      if (err) throw err;

    });
  });


module.exports = router;