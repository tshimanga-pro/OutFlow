const express = require("express");
const router = express.Router();
const passport = require("passport");
const AdminRegister = require("../models/AdminRegister");

// router.get("/registeradmin", (req, res) => {
//   res.render("RegisterAdmin");
// });
router.get("/adminlogin", (req, res) => {
  res.render("AdminLog", { error: "" });
});

router.post("/adminlogin", async (req, res, next) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = (req.body.password || "").trim();

  if (!email || !password) {
    return res.status(400).render("AdminLog", { error: "Access not allowed. Not Admin" });
  }

  try {
    const adminUser = await AdminRegister.findOne({ email });

    if (!adminUser) {
      return res.status(401).render("AdminLog", { error: "Access not allowed" });
    }

    if (String(adminUser.role || "").toLowerCase() !== "admin") {
      return res.status(401).render("AdminLog", { error: "Access not allowed" });
    }

    const result = await AdminRegister.authenticate()(email, password);

    if (!result || !result.user) {
      return res.status(401).render("AdminLog", { error: "Access not allowed" });
    }

    req.login(result.user, (loginErr) => {
      if (loginErr) {
        console.error("Admin login session error:", loginErr);
        return res.status(500).render("AdminLog", { error: "Access not allowed" });
      }

      req.session.isAdmin = true;
      req.session.adminEmail = result.user.email;
      return res.redirect("/admin");
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).render("AdminLog", { error: "Access not allowed" });
  }
});

router.get("/registeradmin", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  const user = req.user;
  if (!user || String(user.role || "").toLowerCase() !== "admin") {
    return res.redirect("/");
  }

  return res.render("RegisterAdmin", { error: "", success: "" });
});

router.post("/registeradmin", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  const user = req.user;
  if (!user || String(user.role || "").toLowerCase() !== "admin") {
    return res.redirect("/");
  }

  try {
    const { firstName, surname, email, telephone, role, password, confirmPassword } = req.body || {};

    const trimmedFirstName = (firstName || "").trim();
    const trimmedSurname = (surname || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedTelephone = (telephone || "").trim();
    const trimmedPassword = (password || "").trim();
    const trimmedConfirmPassword = (confirmPassword || "").trim();
    const selectedRole = (role || "Admin").trim();

    const namePattern = /^[A-Z][a-zA-Z\s]*$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedFirstName || !namePattern.test(trimmedFirstName)) {
      return res.status(400).render("RegisterAdmin", { error: "First Name must start with a capital letter and contain no numbers.", success: "" });
    }

    if (!trimmedSurname || !namePattern.test(trimmedSurname)) {
      return res.status(400).render("RegisterAdmin", { error: "Surname must start with a capital letter and contain no numbers.", success: "" });
    }

    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      return res.status(400).render("RegisterAdmin", { error: "Email must be valid.", success: "" });
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).render("RegisterAdmin", { error: "Password must be at least 6 characters.", success: "" });
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      return res.status(400).render("RegisterAdmin", { error: "Passwords do not match.", success: "" });
    }

    const existingEmail = await AdminRegister.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).render("RegisterAdmin", { error: "Email already in use. Please choose another email.", success: "" });
    }

    const newAdmin = new AdminRegister({
      firstName: trimmedFirstName,
      surname: trimmedSurname,
      email: trimmedEmail,
      telephone: trimmedTelephone || "",
      role: selectedRole
    });

    await AdminRegister.register(newAdmin, trimmedPassword);

    return res.redirect("/admin");
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).render("RegisterAdmin", { error: "One of the submitted values already exists. Please choose different details.", success: "" });
    }

    console.error("Admin registration error:", error);
    return res.status(500).render("RegisterAdmin", { error: "Unable to create the administrator. Please try again.", success: "" });
  }
});

router.get("/admin", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }

  const user = req.user;
  if (!user || String(user.role || "").toLowerCase() !== "admin") {
    return res.redirect("/");
  }

  try {
    // Fetch admin records to display in the dashboard
    const admins = await AdminRegister.find({}, "firstName surname email telephone role").lean();
    const adminFirstName = user && user.firstName ? user.firstName : '';
    return res.render("Admin", { admins, adminFirstName });
  } catch (err) {
    console.error('Failed to load admin list for dashboard:', err);
    const adminFirstName = user && user.firstName ? user.firstName : '';
    return res.render("Admin", { admins: [], adminFirstName });
  }
});

router.get("/admin/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

// Show edit form for an admin
router.get('/admin/edit/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const user = req.user;
  if (!user || String(user.role || '').toLowerCase() !== 'admin') return res.redirect('/');

  try {
    const admin = await AdminRegister.findById(req.params.id).lean();
    if (!admin) return res.redirect('/admin');
    return res.render('EditAdmin', { admin });
  } catch (err) {
    console.error('Error loading admin for edit:', err);
    return res.redirect('/admin');
  }
});

// Handle edit submit
router.post('/admin/edit/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const user = req.user;
  if (!user || String(user.role || '').toLowerCase() !== 'admin') return res.redirect('/');

  const { firstName, surname, telephone, role, password } = req.body || {};
  try {
    const admin = await AdminRegister.findById(req.params.id);
    if (!admin) return res.redirect('/admin');

    admin.firstName = firstName;
    admin.surname = surname;
    admin.telephone = telephone;
    admin.role = role;

    if (password && String(password).trim()) {
      // setPassword provided by passport-local-mongoose
      await new Promise((resolve, reject) => {
        admin.setPassword(String(password).trim(), (err) => {
          if (err) return reject(err);
          return resolve();
        });
      });
    }

    await admin.save();
    return res.redirect('/admin');
  } catch (err) {
    console.error('Error updating admin:', err);
    return res.redirect('/admin');
  }
});

// Show delete confirmation
router.get('/admin/delete/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const user = req.user;
  if (!user || String(user.role || '').toLowerCase() !== 'admin') return res.redirect('/');

  try {
    const admin = await AdminRegister.findById(req.params.id).lean();
    if (!admin) return res.redirect('/admin');
    return res.render('DeleteAdmin', { admin });
  } catch (err) {
    console.error('Error loading admin for delete:', err);
    return res.redirect('/admin');
  }
});

// Perform delete
router.post('/admin/delete/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  const user = req.user;
  if (!user || String(user.role || '').toLowerCase() !== 'admin') return res.redirect('/');

  try {
    await AdminRegister.findByIdAndDelete(req.params.id);
    return res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting admin:', err);
    return res.redirect('/admin');
  }
});

module.exports = router;