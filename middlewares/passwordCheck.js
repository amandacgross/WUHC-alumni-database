var passwordCheck= function (req, res, next) {
  console.log("checking authentication");
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
}; 


// Export the middleware function for use in app.js
module.exports = passwordCheck;