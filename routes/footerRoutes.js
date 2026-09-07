const express = require("express");
const router = express.Router();

// This file is for the footer route. It is imported in server.js and used as middleware. This helps to keep the code organized and modular. Each route can be defined in its own file and imported into server.js. This way, server.js remains clean and easy to read.
router.get("/about", (req, res) => {
  res.render("AboutUs");
});

router.get("/contact", (req, res) => {
  res.render("ContactUs");
});

router.get("/terms", (req, res) => {
  res.render("TermsConditions");
});

router.get("/policy", (req, res) => {
  res.render("PrivacyPolicy");
});


module.exports = router; //its critical to have this line inorder to import the files