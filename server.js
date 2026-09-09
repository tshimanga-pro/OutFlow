//1.Dependencies
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const expressSession = require('express-session');
const passport = require('passport');

// import registration (Subscribe) model 
const Subscribers = require('./models/Subscribers')
const AdminRegister = require('./models/AdminRegister')
require("dotenv").config();


// import routes
const indexRoutes = require("./routes/indexRoutes");
const footerRoutes = require("./routes/footerRoutes");
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const budgetsRoutes = require("./routes/budgetsRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const menuRoutes = require("./routes/menuRoutes");
const adminRoutes = require("./routes/adminRoutes");



// 2.Instantiations
const app = express();
const PORT = 3007 ;

// 3.Configurations
//Mongodb settings- setting up connections to the database.
mongoose.connect(process.env.DB);
mongoose.connection
  .once("open", () => {
    console.log("You are connected to mongoDATABASE");
  })
  .on("error", (err) => {
    console.error(`Connection error:${err.message}`);
  });


//set view engine to pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views")); //specifies the views' directory

// 4.Middleware
// To parse URL encoded data
app.use(express.static(path.join(__dirname, "public"))); //this helps to serve static files like css, js, images from the public folder
app.use(express.static(path.join(__dirname, "publics"))); // serve assets from the publics folder used by the Pug templates
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(express.urlencoded({ extended: false })); //this helps to parse data from forms
app.use(expressSession({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

// Serve favicon if generated; fall back to logo
const fs = require('fs');
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, 'public', 'images', 'favicon-32.png');
  const fallback = path.join(__dirname, 'images', 'Wallet1-2292428_1920.jpg');
  if (fs.existsSync(faviconPath)) return res.sendFile(faviconPath);
  if (fs.existsSync(fallback)) return res.sendFile(fallback);
  return res.status(404).end();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

/* PASSPORT LOCAL AUTHENTICATION */
passport.use("local", Subscribers.createStrategy());
passport.use("admin-local", AdminRegister.createStrategy());

passport.serializeUser((user, done) => {
  if (!user || !user._id) {
    return done(new Error("Failed to serialize user into session: missing user._id"));
  }

  done(null, user._id.toString ? user._id.toString() : user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const subscriber = await Subscribers.findById(id);
    if (subscriber) return done(null, subscriber);

    const admin = await AdminRegister.findById(id);
    return done(null, admin);
  } catch (error) {
    return done(error);
  }
});

// Global variable to make the logged in user available to all pug templates
// Passport automatically attaches the logged in user to req.user
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
})

// 5.Routes
// using imported routes
app.use("/", indexRoutes);
app.use("/", footerRoutes);
app.use("/auth", authRoutes);
app.use("/", expenseRoutes);
app.use("/", budgetsRoutes);
app.use("/", summaryRoutes);
app.use("/", menuRoutes);
app.use("/", adminRoutes);






//non existant routes regardless of the method used(get, post, put, delete) will be caught by this middleware
// This will always the last endpoint in this file
app.use((req, res) => {
  res.status(404).send("Oops! Route not found.");
});

// 6.Bootstrapping Server
app.listen(PORT, () => console.log(`listening on port ${PORT}`));

//full route path
//route path in the server.js + route path in the routes file
//e.g. full path for signup route
//  /auth/signup
//  /auth/login

