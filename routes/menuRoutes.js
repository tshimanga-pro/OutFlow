const express = require("express");
const router = express.Router();

// This file is for the home page route. It is imported in server.js and used as middleware. This helps to keep the code organized and modular. Each route can be defined in its own file and imported into server.js. This way, server.js remains clean and easy to read.
router.get("/menu", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/auth/Login");
  }

  const user = req.user || {};
  const loggedInUser = user.firstName
    ? `${user.firstName} ${user.surname || ""}`.trim()
    : (user.email || "User");

  res.render("Menu", { loggedInUser });
});

module.exports = router; //its critical to have this line inorder to import the files