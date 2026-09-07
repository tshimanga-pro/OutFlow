const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const mongoose = require("mongoose");

// Summary dashboard for authenticated users
router.get("/summary", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.redirect('/Login');
  }

  try {
    // Lifetime total (all-time) grouped by currency
    const lifetimeAgg = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: "$currency", total: { $sum: "$amount" } } }
    ]);

    let lifetimeTotal = 0;
    let lifetimeCurrency = 'UGX';
    if (lifetimeAgg && lifetimeAgg.length === 1) {
      lifetimeCurrency = lifetimeAgg[0]._id || lifetimeCurrency;
      lifetimeTotal = lifetimeAgg[0].total || 0;
    } else if (lifetimeAgg && lifetimeAgg.length > 1) {
      lifetimeTotal = lifetimeAgg.reduce((s, t) => s + (t.total || 0), 0);
      lifetimeCurrency = lifetimeAgg[0]._id ? (lifetimeAgg[0]._id + ' (multiple)') : 'multiple';
    }

    // Month selection (YYYY-MM) from query or default to current month
    const monthParam = req.query.month || new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = monthParam.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    // Fetch transactions for the selected month
    const transactions = await Expense.find({
      user: new mongoose.Types.ObjectId(req.user._id),
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 }).lean();

    const transactionCount = transactions.length;
    const total = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const daysInMonth = end.getDate();
    const averagePerDay = daysInMonth ? (total / daysInMonth) : 0;

    // Category totals
    const categoryTotals = {};
    transactions.forEach(t => {
      const key = t.category || 'Other';
      categoryTotals[key] = (categoryTotals[key] || 0) + (Number(t.amount) || 0);
    });

    const highestCategory = Object.keys(categoryTotals).length
      ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
      : null;

    // Prepare transactions for view (format date)
    const trxForView = transactions.map(t => ({
      id: t._id,
      date: (t.date instanceof Date) ? t.date.toISOString().split('T')[0] : String(t.date),
      category: t.category,
      reason: t.reason,
      amount: t.amount,
      currency: t.currency
    }));

    return res.render('Summary', {
      lifetimeTotal,
      lifetimeCurrency,
      selectedMonth: monthParam,
      totalSpent: total,
      averagePerDay,
      highestCategory: highestCategory ? highestCategory[0] : null,
      transactionCount,
      transactions: trxForView,
      categoryTotals
    });
  } catch (err) {
    console.error('Failed to compute summary:', err);
    return res.render('Summary', {
      lifetimeTotal: 0,
      lifetimeCurrency: 'UGX',
      selectedMonth: new Date().toISOString().slice(0, 7),
      totalSpent: 0,
      averagePerDay: 0,
      highestCategory: null,
      transactionCount: 0,
      transactions: [],
      categoryTotals: {}
    });
  }
});


module.exports = router; //its critical to have this line inorder to import the files