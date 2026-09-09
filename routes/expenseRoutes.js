const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const mongoose = require("mongoose");
const expenseCalculation = require("../utils/expenseCalculation");

router.get("/expensetracker", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect("/auth/Login");
  }

  try {
    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    // Aggregate totals grouped by currency for the selected date
    const totals = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: "$currency", total: { $sum: "$amount" } } }
    ]);

    const budgets = await Budget.find({ user: req.user._id }).lean();
    const budgetLimits = {};
    budgets.forEach((budget) => {
      budgetLimits[budget.category] = Number(budget.limitAmount || 0);
    });

    let dailyTotal = 0;
    let dailyCurrency = 'UGX';
    if (totals && totals.length === 1) {
      dailyCurrency = totals[0]._id || dailyCurrency;
      dailyTotal = totals[0].total || 0;
    } else if (totals && totals.length > 1) {
      // Multiple currencies recorded that day — sum is ambiguous
      // Choose first currency for display but mark the currency as multiple
      dailyCurrency = totals[0]._id || dailyCurrency;
      dailyTotal = totals.reduce((sum, t) => sum + (t.total || 0), 0);
      dailyCurrency = dailyCurrency + ' (multiple)';
    }

    return res.render("Expenses", {
      error: "",
      success: "",
      budgetLimits,
      selectedDate: selectedDate.toISOString().split('T')[0],
      dailyTotal,
      dailyCurrency
    });
  } catch (err) {
    console.error('Error computing daily total:', err);
    return res.render("Expenses", {
      error: "",
      success: "",
      budgetLimits: {},
      selectedDate: new Date().toISOString().split('T')[0],
      dailyTotal: 0,
      dailyCurrency: 'UGX'
    });
  }
});

// JSON endpoint for daily totals (used by client-side fetch)
router.get("/expensetracker/total", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(dateParam);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateParam);
    end.setHours(23, 59, 59, 999);

    const totals = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: "$currency", total: { $sum: "$amount" } } }
    ]);

    const response = { dailyTotal: 0, dailyCurrency: 'UGX', totals };
    if (totals && totals.length === 1) {
      response.dailyCurrency = totals[0]._id || response.dailyCurrency;
      response.dailyTotal = totals[0].total || 0;
    } else if (totals && totals.length > 1) {
      response.dailyTotal = totals.reduce((s, t) => s + (t.total || 0), 0);
      response.dailyCurrency = totals[0]._id ? (totals[0]._id + ' (multiple)') : 'multiple';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in /expensetracker/total:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post("/expensetracker", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).render("Expenses", {
        error: "Please log in to record expenses.",
        success: "",
        budgetLimits: {}
      });
    }

    const { amount, currency, category, date, reason } = req.body;
    const selectedDate = date ? new Date(date) : new Date();

    if (!String(category || "").trim()) {
      return res.status(400).render("Expenses", {
        error: "Please select a category.",
        success: "",
        budgetLimits: {}
      });
    }

    let validatedExpense;
    try {
      validatedExpense = expenseCalculation(category, currency, amount);
    } catch (error) {
      return res.status(400).render("Expenses", {
        error: error.message,
        success: "",
        budgetLimits: {}
      });
    }

    const budget = await Budget.findOne({ user: req.user._id, category: validatedExpense.category }).lean();
    if (budget && Number(budget.limitAmount || 0) > 0 && validatedExpense.amount >= Number(budget.limitAmount)) {
      return res.status(400).render("Expenses", {
        error: `Expense amount must be strictly less than your ${validatedExpense.category} budget limit (${Number(budget.limitAmount)}).`,
        success: "",
        budgetLimits: {}
      });
    }

    const expense = new Expense({
      user: req.user._id,
      amount: validatedExpense.amount,
      currency: validatedExpense.currency,
      category: validatedExpense.category,
      date: selectedDate,
      reason: String(reason || "").trim()
    });

    await expense.save();

    // Recompute daily total for the saved expense's date and persist it
    try {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const totals = await Expense.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.user._id),
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const dailyTotal = totals && totals[0] ? totals[0].total : 0;

      // update the saved expense document with the computed daily total
      await Expense.findByIdAndUpdate(expense._id, { dailyTotal }, { returnDocument: 'after' });
    } catch (err) {
      console.error('Failed to compute/save dailyTotal after expense save:', err);
    }

    return res.status(201).render("Expenses", {
      error: "",
      success: "Expense saved successfully.",
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