var User = require('./models/user.js');
var dateformat = require ('dateformat');

module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // SHOW FRIEND LIST

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// SHOW FRIEND LIST=======================
     app.get('/friend', isLoggedIn, function(req, res) {
        res.render('friend.ejs', { user : req.user, message: req.flash( 'addfriendMessage')});
    });
     // =============================================================================
    // process show message sended ==================================================
    // =============================================================================
    app.get('/sended',isLoggedIn, function(req, res){
        res.render('sended.ejs', { user : req.user, message: req.flash( 'addfriendMessage')});
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));



    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

  

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });
       // =============================================================================
// process add friend ==================================================
// =============================================================================
    app.post('/friend', function(req, res, done){
        var email = req.param('f-email');
        var temp = true;
        if (email)
            email = email.toLowerCase();
        User.findOne({ 'local.email' :  email }, function(err, user) {
            if (err)
            {
                done(err);
                
            }
            else        // if no user is found, return the message
                if (!user)
                {
                     done(null, false, req.flash('addfriendMessage', 'Không tìm thấy người này.'));
                }
            else if (req.user.local.email === email) {
                done(null, false, req.flash('addfriendMessage', 'Không thể thêm chính mình'));
            }else {
                for(var i = 0; i < req.user.friendship.length; i++)
                {
                    if (email === req.user.friendship[i].email)
                    {
                        temp= false;
                        break;
                    }
                }
                //checking has already been friend
                if (temp) {
                    User.update({'local.email' : req.user.local.email}, {$push:{'friendship' :{'email':email}}}, function(err, result){
                    console.log(result);
                    });
                }
                else
                {
                    done(null, false, req.flash('addfriendMessage', 'Đã có trong danh sách bạn'));
                }
            }
            res.redirect('/friend');
    })
    });

    


     // =============================================================================
    // process send message ==================================================
    // =============================================================================

     app.get('/chat', isLoggedIn, function(req, res) {
        res.render('chat.ejs', { user : req.user, message: req.flash( 'addfriendMessage')});
    });

     app.post('/chat', function(req, res, done){
        var message = req.param('message');
        var user    = req.param('user');
        User.findOne({'local.email': user}, function(err, doc){
            if(err){
                done(err);
            } 
            else if (!doc) //if account has been remove
            {
                done(null, false, req.flash('chatMessage', 'No user found.'));
            } 
            else 
            {
                var isodate = new Date();
                isodate = dateformat(isodate, "isoDateTime");
                console.log(isodate);
                User.update({'local.email' : user}, {$push:{"message_rec":{"user_send":req.user.local.email,"message" :message, "Date": isodate }}}, function(err, result){
                    console.log(result);
                    });
                User.update({'local.email': req.user.local.email}, {$push:{"message_send": {"user_rec":user, "message":message, "Date_send": isodate }}}, function(err, result){
                    console.log(result);
                });
            }

        });
        res.redirect('/chat');
    });

      // =============================================================================
    // process read message ==================================================
    // =============================================================================
    app.post('/read_message', isLoggedIn, function(req, res){
        var user = req.param('user');
        var date = req.param('date');
        var isodate = new  Date(date);
        isodate.setHours(isodate.getHours() - 7);

//isodate = dateformat(isodate, "isoDateTime");
        console.log(user);
        console.log(isodate.toISOString());
        
        var idate = new Date();
        idate = dateformat(idate, "isoDateTime");

        User.find({"message_send.Date_send":{$eq:isodate}}, function(err, doc){
            console.log(doc);
        });

        User.update({"local.email":user, "message_send.Date_send":isodate}, {$set:{"message_send.$.Date_seen":idate}}, function(err, doc){
           console.log(doc);
        });

        User.update({"local.email":req.user.local.email, "message_rec.Date":isodate}, {$set:{"message_rec.$.read":true}}, function(err, doc){
            console.log(doc);
        });
         res.redirect('/profile');
        
        
    });

     // =============================================================================
    // process remove friend ==================================================
    // =============================================================================

    app.post('/remove_friend', function(req, res, done){
        var user = req.param('user');
        console.log(user);
        User.update({'local.email':req.user.local.email}, {$pull:{'friendship': {'email':user}}}, function(err, doc){
            if (err)
                done(err);
            else
                console.log(doc);
        });
        res.redirect('/friend');
    });


};

    

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
