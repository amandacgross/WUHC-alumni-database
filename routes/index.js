var express = require('express');
var router = express.Router();
var path = require('path');
var vogels = require('vogels');
var util   = require('util');
var _      = require('lodash');
var Joi = require('joi');
var fs = require('fs');
var crypto = require('crypto-js/sha256');

//
// Set up connection to AWS
//
//var access=JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'public','javascripts', 'access.json'), 'utf8'));
vogels.AWS.config.update({accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey,
region: "us-east-1"});
//vogels.AWS.config.update({accessKeyId: access.accessKeyId, secretAccessKey: access.secretAccessKey,
// region: "us-east-1"});

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
    school	: Joi.string(),
    photo : Joi.string(),
    email : Joi.string()
  }
});

var UserAccount = vogels.define('UserAccount', {
  hashKey  : 'email', // all users must have unique usernames
  // add the timestamp attributes (updatedAt, createdAt)
  timestamps : false,
  schema : {
    password : Joi.string(), // store the hash of it with --> var hash = CryptoJS.SHA512("Message");
    firstName   : Joi.string(),
    lastName   : Joi.string(),
    email : Joi.string(),
    saved : vogels.types.stringSet() // set of all strings of the id's of saved alumni profiles 
  }
});

/*vogels.createTables(function(err) {
  if (err) {
    console.log('Error creating tables: ', err);
  } else {
    console.log('Tables has been created');
  }
});*/

var alumniMap = new Map();
var accountsMap = new Map();

Alumni.config({tableName : 'Alumni'});
UserAccount.config({tableName : 'UserAccount'});

var fetchedTable;
var checkValidLogin = require('../middlewares/passwordCheck');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'login.html'));
});

router.get('/createAccount', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'createAccount.html'));
});

router.get('/insertProfile', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'insertProfile.html'));
});

// Not sure if work, bc unable to access aws 
router.post('/checkPassword', function (req, res, next) {
  console.log("checking password");
  UserAccount.get(req.body.email, function (err, resp) {
    if (err) {
      console.log('Error finding account', err);
      res.redirect('/login');
    } else if (resp == null) {
      res.redirect('/');
    } else {
      var hashPass = resp.attrs.password;
      if (req.body.password == hashPass) {
        console.log('here');
        req.session.isAuthenticated = true;
        req.user = resp.username;
        res.redirect('/lookup');
      } else {
        res.redirect('/');
      }
    }
  });
});

 // Not sure if work, bc unable to access aws 
 router.post('/create', function (req, res, next) {
  console.log("creating account");
  console.log(req.body);
  UserAccount.create( {
   password : req.body.password,
   firstName   : req.body.firstname,
   lastName   : req.body.lastname,
   email : req.body.email,
   saved : []
 }, function(err, resp) {
  console.log("ERE")
  if(err) {
    console.log('Error creating account', err);
  } else {
    req.session.isAuthenticated = true;
    req.user = resp.username;
    res.redirect('/lookup');
  }
})
});

  // Not sure if work, bc unable to access aws 
  router.post('/insert', function (req, res, next) {
    console.log("inserting profile");
    console.log(req.body);
    Alumni.create( {
     firstName   : req.body.firstname,
     lastName   : req.body.lastname,
     email : req.body.email,
     gradYear    : req.body.year,
     industry     : req.body.industry,
     location  : req.body.location,
     organization  : req.body.organization,
     school  : req.body.school,
     aID: Math.random()*1234325252
   }, function(err, resp) {
    if(err) {
      console.log('err')
      console.log('Error creating account', err);
    } else {
      console.log("creating account");
      console.log(req.body);
      UserAccount.create( {
       password : req.body.password,
       firstName   : req.body.firstname,
       lastName   : req.body.lastname,
       email : req.body.email,
       saved : []
     }, function(err, resp) {
      console.log("ERE")
      if(err) {
        console.log('Error creating account', err);
      } else {
        req.session.isAuthenticated = true;
        req.user = resp.username;
        res.redirect('/lookup');
      }
    })
    }
  })
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
  res.json(alumniMap.get(parseFloat(aid)));
});

router.get('/insert/:values', function(req,res) {
 var value = req.params.values.split('&');
    //console.log('INSERT INTO Person(login,name,sex,relationshipStatus,birthyear) VALUES("'+value[0]+'","'+value[1]+'","'+value[2]+'","'+value[3]+'","'+value[4]+'")');
    connection.query('INSERT INTO Person(login,name,sex,relationshipStatus,birthyear) VALUES("'+value[0]+'","'+value[1]+'","'+value[2]+'","'+value[3]+'","'+value[4]+'")' ,function (err, rows, fields) {
      if (err) throw err;

    });
  });


module.exports = router;