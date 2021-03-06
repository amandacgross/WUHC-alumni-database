var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var uuid = require('node-uuid');

var index = require('./routes/index');
// checks if a user is logged in, otherwise redirects to login
var passwordCheck = require('./middlewares/passwordCheck'); 

var app = express();

// Generate a random cookie secret for this app
var generateCookieSecret = function () {
  return 'iamasecret' + uuid.v4();
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// to have password protected sessions
app.use(cookieSession({
  secret: generateCookieSecret()
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/createAlumnus', index);
app.use('/createStudent', index);
app.use('/lookup', passwordCheck, index);
app.use('/studentProfile', passwordCheck);
app.use('/alumnusProfile', passwordCheck);
// app.use('/saved', passwordCheck);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
});

app.listen(process.env.PORT || 8080, function(){
  console.log('Port:' + process.env.PORT);
	//console.log('Server running on heroku provided port');
});

module.exports = app;
