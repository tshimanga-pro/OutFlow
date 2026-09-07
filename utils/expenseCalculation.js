function expenseCalculation(category, currency, amount) {
  const normalizedCategory = String(category || "").trim();
  const normalizedCurrency = String(currency || "UGX").trim().toUpperCase();
  const normalizedAmount = Number(amount);

  if (!normalizedCategory) {
    throw new Error("Please select a category.");
  }

  if (Number.isNaN(normalizedAmount) || normalizedAmount < 0) {
    throw new Error("Amount is required and cannot be negative.");
  }

  return {
    category: normalizedCategory,
    currency: normalizedCurrency,
    amount: normalizedAmount
  };
}

module.exports = expenseCalculation;
