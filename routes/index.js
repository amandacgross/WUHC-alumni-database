var express = require('express');
var router = express.Router();
var path = require('path');
var vogels = require('vogels');
var util = require('util');
var _ = require('lodash');
var Joi = require('joi');
var fs = require('fs');
var crypto = require('crypto-js/sha256');

//
// Set up connection to AWS
//
//var access=JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'public','javascripts', 'access.json'), 'utf8'));
vogels.AWS.config.update({accessKeyId: process.env.accessKeyId, secretAccessKey: process.env.secretAccessKey,
region: "us-east-1"});

var Alumni = vogels.define('Alumni', {
    hashKey: 'aID',
    timestamps: false,
    schema: {
  	    aID: Joi.number(),
        firstName: Joi.string(),
        gradYear: Joi.number(),
        industry: Joi.string(),
        lastName: Joi.string(),
        location: Joi.string(),
        organization: Joi.string(),
        school: Joi.string(),
        photo: Joi.string(),
        email: Joi.string()
    }
});
var Students = vogels.define('Students', {
    hashKey: 'sID',
    timestamps: false,
    schema: {
        sID: Joi.number(),
        firstName: Joi.string(),
        gradYear: Joi.number(),
        lastName: Joi.string(),
        location: Joi.string(),
        school: Joi.string(),
        photo: Joi.string(),
        email: Joi.string()
    }
});
var UserAccount = vogels.define('UserAccount', {
    hashKey: 'email',
    timestamps: false,
    schema: {
        password: Joi.string(), // store the hash of it with --> var hash = CryptoJS.SHA512("Message");
        firstName: Joi.string(),
        lastName: Joi.string(),
        email: Joi.string()
        //saved: vogels.types.stringSet() // set of all strings of the id's of saved alumni profiles 
    }
});
Alumni.config({tableName : 'Alumni'});
Students.config({tableName: 'Students'});
UserAccount.config({tableName : 'UserAccount'});

var alumniMap = new Map();
var alumniEmails = [];
var studentsMap = new Map();
var studentEmails = [];
var userEmail;
var userType;
var fetchedTable;

var checkValidLogin = require('../middlewares/passwordCheck');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../', 'views', 'login.html'));
});

router.get('/createStudent', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../', 'views', 'createStudent.html'));
});
router.get('/createAlumnus', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../', 'views', 'createAlumnus.html'));
});

router.post('/checkPassword', function (req, res, next) {
    UserAccount.get(req.body.email, function (err, resp) {
        if (err) {
            console.log('Error finding account', err);
            res.redirect('/?err=true');
        } else if (resp == null) {
            res.redirect('/?err=true');
        } else {
            userEmail = req.body.email;
            var hashPass = resp.attrs.password;
            if (req.body.password == hashPass) {
                req.session.isAuthenticated = true;
                req.user = resp.username;
                res.redirect('/lookup');
            } else {
                res.redirect('/?err=true');
            }
        }
    });
});

router.post('/logout', function(req, res, next) {
    req.session.isAuthenticated = false;
    res.redirect('/');
})

router.get('/studentProfile', function(req, res, next) {
    if(req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname, '../', 'views', 'studentProfile.html'));
    } else {
        res.redirect('/');
    }
});
router.get('/alumnusProfile', function(req, res, next) {
    if(req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname, '../', 'views', 'alumnusProfile.html'));
    } else {
        res.redirect('/');
    }
});

router.get('/lookup', function(req, res, next) {
    if(req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname, '../', 'views', 'lookup.html'));
    } else {
        res.redirect('/');
    }
});

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
                alumniMap.set(id, contents);
                alumniEmails.push(contents.email);
                i++;
            }
            if(resp.ConsumedCapacity) {
                console.log('----------------------------------------------------------------------');
                console.log('Scan consumed: ', resp.ConsumedCapacity);
            }
        }
        if (!alumniEmails.includes(userEmail)) {  //user is student
            userType = "Student";
            res.json(resp);
        }
        console.log('----------------------------------------------------------------------');
    });
    Students.scan().exec(function(err, resp) {
        console.log('----------------------------------------------------------------------');
        if(err) {
            console.log('Error running scan', err);
        } else {
            console.log('Found', resp.Count, 'items');
            fetchedTable = resp.Items;
            var i=0;
            for (row in fetchedTable) {
                var id = fetchedTable[i].attrs.sID;
                var contents = fetchedTable[i].attrs;
                console.log(fetchedTable[i].attrs);
                studentsMap.set(id, contents);
                studentEmails.push(contents.email);
                i++;
            }
            if(resp.ConsumedCapacity) {
                console.log('----------------------------------------------------------------------');
                console.log('Scan consumed: ', resp.ConsumedCapacity);
            }
        }
        if (!studentEmails.includes(userEmail)) {
            userType = "Alumnus";
            res.json(resp);
        }
        console.log('----------------------------------------------------------------------');
    });
});

router.get('/data/show/credentials', function(req, res) {
    var credentials = {"accessKeyId": process.env.accessKeyId, "secretAccessKey": process.env.secretAccessKey};
    res.json(credentials);
});

router.get('/data/show/profile/:id', function(req,res) {
    var id = req.params.id;
    if (userType == "Alumnus"){
        res.json(studentsMap.get(parseFloat(id)));
    } else {
        res.json(alumniMap.get(parseFloat(id)));
    }
});


module.exports = router;