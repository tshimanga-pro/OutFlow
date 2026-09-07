const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");

const categories = [
  "Food",
  "Transport",
  "Rent",
  "Utility",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Other"
];

router.get("/budgets", async (req, res) => {
  const warning = req.query.warning || "";

  try {
    const savedBudgets = await Budget.find(req.user ? { user: req.user._id } : {});
    const budgetMap = {};

    savedBudgets.forEach((item) => {
      budgetMap[item.category] = {
        limitAmount: item.limitAmount,
        currency: item.currency
      };
    });

    return res.render("Budgets", {
      warning,
      budgetMap
    });
  } catch (error) {
    console.error("Load budget error:", error);
    return res.render("Budgets", {
      warning,
      budgetMap: {}
    });
  }
});

router.post("/budgets", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.redirect("/auth/Login");
    }

    const missingOrZero = categories.some((category) => {
      const inputId = `${category.toLowerCase()}Limit`;
      const rawValue = req.body[inputId];
      const amount = Number(rawValue || 0);
      return !rawValue || rawValue === "" || amount <= 0;
    });

    if (missingOrZero) {
      return res.status(400).render("Budgets", {
        warning: "All category limits must be filled and cannot be zero.",
        success: "",
        budgetMap: {}
      });
    }

    const budgetEntries = [];

    for (const category of categories) {
      const inputId = `${category.toLowerCase()}Limit`;
      const currencyId = `${category.toLowerCase()}Currency`;
      const amount = Number(req.body[inputId] || 0);
      const currency = String(req.body[currencyId] || "UGX").trim().toUpperCase();

      if (amount > 0) {
        budgetEntries.push({
          user: req.user._id,
          category,
          limitAmount: amount,
          currency
        });
      }
    }

    await Promise.all(
      budgetEntries.map((entry) =>
        Budget.findOneAndUpdate(
          { user: entry.user, category: entry.category },
          entry,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    return res.status(200).render("Budgets", {
      warning: "",
      success: "Budget limits saved successfully.",
      budgetMap: {}
    });
  } catch (error) {
    console.error("Budget save error:", error);
    return res.status(500).render("Budgets", {
      warning: "",
      success: "",
      budgetMap: {}
    });
  }
});

module.exports = router;