const user = require("./models/user");

module.exports = function(app, passport, db) {

const {ObjectId} = require('mongodb') //gives access to _id in mongodb
// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
         //req.user if user is logged in and makigng a request, you can see everything bout that user also passed in.. Good for making profile pgs
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('workout-posts').find().toArray((err, result) => {
          if (err) return console.log(err)
          console.log(result)

          
          res.render('profile.ejs', {
            user : req.user
          })
        })
    });

  //   app.get('/profile', isLoggedIn, function(req, res) {
  //     db.collection('plants').find().toArray((err, result) => {
  //       if (err) return console.log(err)
  //       console.log(result)

  //       let bigPlants = result.filter(doc => doc.plantInfo.name === req.user.local.email)

  //       res.render('profile.ejs', {
  //         user : req.user, 
  //         plants: result,
  //         bigPlants: myPlants
  //       })
  //     })
  // });

    // HOME SECTION =================================
    app.get('/home', isLoggedIn, function(req, res) {
      db.collection('workout-posts').find({name: req.user.local.email}).toArray((err, result) => {
        if (err) return console.log(err)
        console.log('result', result)

        //update find to filter out/
        // let myWorkLogs = result.filter(doc => doc.name === req.user.local.email)
        // console.log('myWorkLogs', myWorkLogs)

        res.render('home.ejs', {
          user : req.user, 
          myWorkLogs: result
        })
      })
  });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// Home Page Routes ===============================================================

    app.post('/addWorkoutLog', (req, res) => {
      db.collection('workout-posts').insertOne({name: req.body.name, date: req.body.date, workoutHours: req.body.workoutHours, workoutMinutes: req.body.workoutMinutes, workoutRoutine: req.body.workoutRoutine, workoutNotes: req.body.workoutNotes, starred: true}, (err, result) => {
        if (err) return console.log(err)
        //console.log(result)
        console.log('saved to database')
        res.redirect('/home')
      })
    })

    app.put('/addStarred', (req, res) => {
        db.collection('workout-posts')
        .findOneAndUpdate({ _id: ObjectId(req.body.postObjectID)}, 
        {
          $set: {
            starred: true
          }
        },
         {
          sort: {_id: -1}, //Sorts documents in db ascending (1) or descending (-1)
          upsert: true
        }, (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        })
      })

      app.put('/removeStarred', (req, res) => {
        db.collection('workout-posts')
        .findOneAndUpdate({ _id: ObjectId(req.body.postObjectID)}, 
        {
          $set: {
            starred: false
          }
        },
         {
          sort: {_id: -1}, //Sorts documents in db ascending (1) or descending (-1)
          upsert: true
        }, (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        })
      })


      app.delete('/deleteWorkoutPost', (req, res) => {
        db.collection('workout-posts').findOneAndDelete({ _id: ObjectId(req.body.postObjectID)}, (err, result) => {
          if (err) return res.send(500, err)
          res.send('Message deleted!')
        })
      })

// message board routes ===============================================================
    // app.put('/messages', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp + 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

    // app.put('/messagesTDown', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp - 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

   

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
            successRedirect : '/home', // redirect to the secure profile section
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
            successRedirect : '/home', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        let user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
