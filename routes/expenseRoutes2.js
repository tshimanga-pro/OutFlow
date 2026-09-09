const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.get("/expensetracker", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect("/auth/Login");
  }

  return res.render("Expenses", {
    error: "",
    success: "",
    budgetLimits: {}
  });
});

router.post("/expensetracker", async (req, res, next) => {
  try {
    if (req.isAuthenticated() && req.user) {
      const { amount, currency, category, date, reason } = req.body;
      const parsedAmount = Number(amount);
      const selectedDate = date ? new Date(date) : new Date();

      if (amount === undefined || amount === null || amount === "" || Number.isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).render("Expenses", {
          error: "Amount is required and cannot be negative.",
          success: "",
          budgetLimits: {}
        });
      }

      if (!category) {
        return res.status(400).render("Expenses", {
          error: "Please select a category.",
          success: "",
          budgetLimits: {}
        });
      }

      const expense = new Expense({
        user: req.user._id,
        amount: parsedAmount,
        currency: (currency || "UGX").trim().toUpperCase(),
        category: String(category).trim(),
        date: selectedDate,
        reason: String(reason || "").trim()
      });

      await expense.save();

      return res.status(201).render("Expenses", {
        error: "",
        success: "Expense saved successfully.",
        budgetLimits: {}
      });
    }

    return res.status(401).render("Expenses", {
      error: "Please log in to record expenses.",
      success: "",
      budgetLimits: {}
    });
  } catch (error) {
    console.error("Expense save error:", error);
    return res.status(500).render("Expenses", {
      error: "Unable to save expense. Please try again.",
      success: "",
      budgetLimits: {}
    });
  }
});

module.exports = router;