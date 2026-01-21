const express = require("express");
const Router = express.Router();
const authMiddleware = require("../middleware/authentication");
const { Income, User } = require("../db");

/* ================= UTILITY ================= */

function isWithin15Days(date) {
  const diff = Date.now() - new Date(date).getTime();
  return diff <= 15 * 24 * 60 * 60 * 1000;
}

// Helper to get the standard list response (Last 15 days, sorted)
async function getRecentIncomes(userId) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 15);

  return await Income.find({
    user_id: userId,
    createdAt: { $gte: fromDate }
  }).sort({ createdAt: -1 });
}

/* ================= LIST (last 15 days) ================= */

Router.get("/list", authMiddleware, async (req, res) => {
  try {
    const incomes = await getRecentIncomes(req.userId);
    res.json(incomes);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

/* ================= ADD ================= */

Router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { amount, paymentType, receivedFrom } = req.body;

    await Income.create({
      amount,
      paymentType, // Matches Schema (was correct here)
      receivedFrom, // Matches Schema (was correct here)
      user_id: req.userId
    });

    // Update User Balance
    const update =
      paymentType === "cash"
        ? { $inc: { cashBalance: amount } }
        : { $inc: { onlineBalance: amount } };

    await User.findByIdAndUpdate(req.userId, update);

    const incomes = await getRecentIncomes(req.userId);
    res.json(incomes);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to add income");
  }
});

/* ================= EDIT ================= */

Router.put("/edit/:id", authMiddleware, async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!income) return res.status(404).json("Income not found");

    if (!isWithin15Days(income.createdAt))
      return res.status(403).json("Edit allowed only within 15 days");

    // 1. Revert old balance
    // FIXED: Changed 'income.method' to 'income.paymentType'
    const revertOld =
      income.paymentType === "cash"
        ? { $inc: { cashBalance: -income.amount } }
        : { $inc: { onlineBalance: -income.amount } };
    await User.findByIdAndUpdate(req.userId, revertOld);

    // 2. Apply new balance
    const newAmount = Number(req.body.amount);
    // FIXED: Using 'paymentType' from body or keeping existing
    const newType = req.body.paymentType || income.paymentType; 

    const applyNew =
      newType === "cash"
        ? { $inc: { cashBalance: newAmount } }
        : { $inc: { onlineBalance: newAmount } };
    await User.findByIdAndUpdate(req.userId, applyNew);

    // 3. Update Document
    income.amount = newAmount;
    // FIXED: Changed 'source' to 'receivedFrom'
    income.receivedFrom = req.body.receivedFrom || income.receivedFrom;
    income.paymentType = newType;
    
    await income.save();

    const incomes = await getRecentIncomes(req.userId);
    res.json(incomes);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to edit income");
  }
});

/* ================= DELETE ================= */

Router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!income) return res.status(404).json("Income not found");

    if (!isWithin15Days(income.createdAt))
      return res.status(403).json("Delete allowed only within 15 days");

    // FIXED: Changed 'income.method' to 'income.paymentType'
    const update =
      income.paymentType === "cash"
        ? { $inc: { cashBalance: -income.amount } }
        : { $inc: { onlineBalance: -income.amount } };

    await User.findByIdAndUpdate(req.userId, update);
    await Income.findByIdAndDelete(income._id);

    const incomes = await getRecentIncomes(req.userId);
    res.json(incomes);
  } catch (err) {
    console.log(err);
    res.status(500).json("Failed to delete income");
  }
});

module.exports = Router;