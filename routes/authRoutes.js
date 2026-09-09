// 1. Dependencies
const express = require("express");
const router = express.Router();
const passport = require("passport");

// 2. Import registration (Subscriber) file model
const Subscriber = require("../models/Subscribers");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/Subscribe", (req, res) => {
  res.render("Register", { error: "" });
});

router.post("/Subscribe", async (req, res) => {
  try {
    const { firstName, surname, email, telephone, password, confirmPassword } = req.body;

    const trimmedFirstName = (firstName || "").trim();
    const trimmedSurname = (surname || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedTelephone = (telephone || "").trim();
    const trimmedPassword = (password || "").trim();
    const trimmedConfirmPassword = (confirmPassword || "").trim();

    const namePattern = /^[A-Z][a-zA-Z\s]*$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedFirstName) {
      return res.status(400).render("Register", { error: "First Name is required." });
    }
    if (!namePattern.test(trimmedFirstName)) {
      return res.status(400).render("Register", { error: "First Name must start with a capital letter and contain no numbers." });
    }

    if (!trimmedSurname) {
      return res.status(400).render("Register", { error: "Surname is required." });
    }
    if (!namePattern.test(trimmedSurname)) {
      return res.status(400).render("Register", { error: "Surname must start with a capital letter and contain no numbers." });
    }

    if (!trimmedEmail) {
      return res.status(400).render("Register", { error: "Email is required." });
    }
    if (!emailPattern.test(trimmedEmail)) {
      return res.status(400).render("Register", { error: "Email must be valid." });
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).render("Register", { error: "Password must be at least 6 characters." });
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      return res.status(400).render("Register", { error: "Passwords do not match." });
    }

    // const existingFirstName = await Subscriber.findOne({
    //   firstName: { $regex: `^${escapeRegex(trimmedFirstName)}$`, $options: "i" }
    // });
    // if (existingFirstName) {
    //   return res.status(400).render("Register", { error: "A user with this first name already exists." });
    // }

    // const existingSurname = await Subscriber.findOne({
    //   surname: { $regex: `^${escapeRegex(trimmedSurname)}$`, $options: "i" }
    // });
    // if (existingSurname) {
    //   return res.status(400).render("Register", { error: "A user with this surname already exists." });
    // }

    const existingEmail = await Subscriber.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).render("Register", { error: "Email already in use. Please use a different email address." });
    }

    const passwordCheckUser = new Subscriber();
    await passwordCheckUser.setPassword(trimmedPassword);
    const existingPassword = await Subscriber.findOne({ password: passwordCheckUser.password });
    if (existingPassword) {
      return res.status(400).render("Register", { error: "That password has already been used. Please choose another password." });
    }

    const newSubscriber = new Subscriber({
      firstName: trimmedFirstName,
      surname: trimmedSurname,
      email: trimmedEmail,
      telephone: trimmedTelephone || "",
      password: trimmedPassword
    });

    await Subscriber.register(newSubscriber, trimmedPassword);
    return res.status(201).render("Register", {
      error: "",
      success: `Registration successful for ${trimmedFirstName} ${trimmedSurname}. You can now log in.`
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).render("Register", { error: "One of the submitted values already exists. Please choose different details." });
    }

    console.error(error);
    res.status(500).render("Register", { error: "Unable to create user. Please try again." });
  }
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        return next(sessionErr);
      }

      res.clearCookie("connect.sid");
      return res.redirect("/auth/Login");
    });
  });
});

router.get("/Login", (req, res) => {
  const error = req.query.error || "";
  res.render("LogIn", { error });
});

router.post("/Login", async (req, res, next) => {
  try {
    const trimmedEmail = (req.body.email || "").trim().toLowerCase();
    const trimmedPassword = (req.body.password || "").trim();

    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).render("LogIn", { error: "Email and password are required." });
    }

    const existingUser = await Subscriber.findOne({ email: trimmedEmail });
    if (!existingUser) {
      const errorMessage = "Invalid email or password. Provide the correct information, or subscribe.";
      return res.redirect(`/auth/Login?error=${encodeURIComponent(errorMessage)}`);
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error(err);
        return res.status(500).render("LogIn", { error: "An error occurred during login." });
      }

      if (!user) {
        const errorMessage = info && info.message
          ? info.message
          : "Invalid email or password. Provide the correct information, or subscribe.";
        return res.redirect(`/auth/Login?error=${encodeURIComponent(errorMessage)}`);
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error(loginErr);
          return res.status(500).render("Register", { error: "Unable to log in. Please try again." });
        }

        return res.redirect("/menu");
      });
    })(req, res, next);
  } catch (error) {
    console.error(error);
    return res.status(500).render("LogIn", { error: "Unable to process your login request." });
  }
});

module.exports = router;
