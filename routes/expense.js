const Express = require("express");
const { Expense, Category, User } = require("../db");
const authMiddleware = require("../middleware/authentication");
const upload = require("../middleware/upload");
const model = require("../utils/gemini");
const Router = Express.Router();

/* ================= ADD EXPENSE ================= */

Router.post("/add/:categoryId", authMiddleware, async function (req, res) {
  const { amount, paymentType } = req.body;
  const categoryId = req.params.categoryId;
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json("User not found");

  const balanceField =
    paymentType === "cash" ? "cashBalance" : "onlineBalance";

  // if (amount > user[balanceField]) {
  //   return res.status(400).json("Insufficient balance");
  // }
 
  // if (amount > user.monthlyBudget) {
  //   return res.status(400).json("Monthly budget exceeded");
  // }

  const expense = await Expense.create({
    amount,
    paymentType,
    category_id: categoryId,
    user_id: userId
  });

  await Category.findOneAndUpdate(
    { _id: categoryId, user_id: userId },
    { $inc: { cat_total: amount } }
  );

  await User.findByIdAndUpdate(userId, {
    $inc: {
      [balanceField]: -amount,
      monthlyBudget: -amount
    }
  });

  res.json(expense);
});

/* ================= EDIT EXPENSE ================= */

Router.put("/edit/:expenseId", authMiddleware, async function (req, res) {
  const { amount } = req.body;
  const expenseId = req.params.expenseId;
  const userId = req.userId;

  const expense = await Expense.findOne({
    _id: expenseId,
    user_id: userId
  });

  if (!expense) return res.status(404).json("Expense not found");

  const diff = amount - expense.amount;

  if (diff === 0) {
    return res.json("No change");
  }

  const user = await User.findById(userId);
  const balanceField =
    expense.paymentType === "cash" ? "cashBalance" : "onlineBalance";

  // If increasing expense, treat diff as new spending
  if (diff > 0) {
    if (diff > user[balanceField]) {
      return res.status(400).json("Insufficient balance");
    }
    if (diff > user.monthlyBudget) {
      return res.status(400).json("Monthly budget exceeded");
    }
  }

  await Expense.findByIdAndUpdate(expenseId, { amount });
  
  await Category.findOneAndUpdate(
    { _id: expense.category_id, user_id: userId },
    { $inc: { cat_total: diff } }
  );

  await User.findByIdAndUpdate(userId, {
    $inc: {
      [balanceField]: -diff,
      monthlyBudget: -diff
    }
  });
  const categoryId=expense.category_id;
  const expenses = await Expense.find({
    category_id: categoryId,
    user_id: userId
  }).sort({ createdAt: -1 });

  res.json(expenses);
});

/* ================= DELETE EXPENSE ================= */

Router.delete("/delete/:expenseId", authMiddleware, async function (req, res) {
  const expenseId = req.params.expenseId;
  const userId = req.userId;

  const expense = await Expense.findOne({
    _id: expenseId,
    user_id: userId
  });

  if (!expense) return res.status(404).json("Expense not found");

  const balanceField =
    expense.paymentType === "cash" ? "cashBalance" : "onlineBalance";

  await Category.findOneAndUpdate(
    { _id: expense.category_id, user_id: userId },
    { $inc: { cat_total: -expense.amount } }
  );

  await User.findByIdAndUpdate(userId, {
    $inc: {
      [balanceField]: expense.amount,
      monthlyBudget: expense.amount
    }
  });
  const categoryId=expense.category_id;
  await Expense.findByIdAndDelete(expenseId);
  const expenses = await Expense.find({
    category_id: categoryId,
    user_id: userId
  }).sort({ createdAt: -1 });

  res.json(expenses);
});

/* ================= VIEW TRANSACTIONS ================= */

Router.get("/list/:categoryId", authMiddleware, async function (req, res) {
  const categoryId = req.params.categoryId;
  const userId = req.userId;

  const expenses = await Expense.find({
    category_id: categoryId,
    user_id: userId
  }).sort({ createdAt: -1 });

  res.json(expenses);
});
//Scan bill Endpoint
Router.post(
  "/scan-bill",
  authMiddleware, 
  upload.single("bill"),
  async function (req, res) {
    try {
      if (!req.file) {
        return res.status(400).json("No image uploaded");
      }
      console.log("Scanning bill...");

      // 1. Prepare the image data
      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      };

      // 2. Prepare the prompt
      const prompt = `
        You are an expense tracker assistant. Analyze this receipt image.
        Extract:
        1. Total Amount (number only).
        2. Merchant/Shop Name.
        3. Category (one of: Food, Travel, Shopping, Utilities, Entertainment, Other).
        
        Return ONLY valid JSON format like this:
        { "amount": 100, "merchant": "Starbucks", "category": "Food" }
      `;

      // 3. Generate content using the Standard SDK syntax
      // Pass the prompt and image as an array
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // 4. Parse the JSON result
      // Remove any markdown code blocks (```json ... ```)
      const cleanedText = text.replace(/```json|```/g, "").trim();
      const jsonResult = JSON.parse(cleanedText);

      res.json(jsonResult);

    } catch (err) {
      console.error("Scan Error details:", err);
      res.status(500).json("Failed to scan bill");
    }
  }
);
//* ================= SMART ADD EXPENSE (FIND OR CREATE CATEGORY) ================= */
Router.post("/add-smart", authMiddleware, async function (req, res) {
  try {
    const { amount, categoryName, paymentType } = req.body;
    const userId = req.userId;

    if (!amount || !categoryName) {
      return res.status(400).json("Amount and Category are required");
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json("User not found");

    // 1. Check Balance
    const balanceField = paymentType === "cash" ? "cashBalance" : "onlineBalance";
    if (amount > user[balanceField]) {
      return res.status(400).json("Insufficient balance");
    }
    if (amount > user.monthlyBudget) {
      return res.status(400).json("Monthly budget exceeded");
    }

    // 2. Find Category (Case Insensitive) OR Create New
    // We search for 'cat_name' matching the input
    let category = await Category.findOne({
      cat_name: { $regex: new RegExp(`^${categoryName}$`, "i") },
      user_id: userId
    });

    // If category doesn't exist, create it on the fly
    if (!category) {
      category = await Category.create({
        cat_name: categoryName, // Uses the schema property 'cat_name'
        user_id: userId
        // Mongoose defaults will handle cat_total: 0
      });
    }

    // 3. Create Expense linked to that category
    const expense = await Expense.create({
      amount,
      paymentType,
      category_id: category._id,
      user_id: userId
    });

    // 4. Update Category Total & User Balance
    await Category.findByIdAndUpdate(category._id, { 
      $inc: { cat_total: amount } 
    });
    
    await User.findByIdAndUpdate(userId, {
      $inc: {
        [balanceField]: -amount,
        monthlyBudget: -amount
      }
    });

    res.json(expense);

  } catch (err) {
    console.error("Smart Add Error:", err);
    res.status(500).json("Server Error");
  }
});

module.exports = Router;
