// passport.js

var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser')

// load up the user model
var User = require('../app/models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous : User.findOne wont fire unless data is sent back
        process.nextTick(function() {
	        User.findOne({ 'local.email' :  email }, function(err, userMail) {
	            if (err) 
                    return done(err);

	            if (userMail) {
	                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));

	            } else {

                    User.findOne({ 'local.username' : req.body.username }, function(err, user) {
                        if (err) 
                            return done(err);

                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That username is already taken.'));

                        } else {

                            var newUser = new User();

                            newUser.local.firstname = req.body.firstname;
                            newUser.local.lastname = req.body.lastname;
                            newUser.local.username = req.body.username;
                            newUser.local.email    = email;
                            newUser.local.password = newUser.generateHash(password);

                            // save the user
                            newUser.save(function(err) {
                                if (err) 
                                    throw err;
                                
                                return done(null, newUser);
                            });
                        }
                    });
	            }

	        });    
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        User.findOne({ 'local.email' :  email }, function(err, user) {
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));


};
