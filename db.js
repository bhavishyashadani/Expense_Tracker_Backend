const mongoose = require("mongoose");


/* ================= USER ================= */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    userName: {
      type: String,
      unique: true,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    cashBalance: {
      type: Number,
      required: true,
      default: 0
    },

    onlineBalance: {
      type: Number,
      required: true,
      default: 0
    },

    monthlyBudget: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

/* ================= CATEGORY ================= */

const categorySchema = new mongoose.Schema(
  {
    cat_name: {
      type: String,
      required: true
    },

    // current month spend
    cat_total: {
      type: Number,
      default: 0
    },

    // previous month spend (rolled over)
    cat_prevmonth: {
      type: Number,
      default: 0
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

/* ================= EXPENSE ================= */

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },

    paymentType: {
      type: String,
      enum: ["cash", "online"],
      required: true
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

/* ================= INCOME ================= */

const incomeSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },

    paymentType: {
      type: String,
      enum: ["cash", "online"],
      required: true
    },

    receivedFrom: {
      type: String,
      required: true
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

/* ================= MODELS ================= */

const User = mongoose.model("User", userSchema);
const Category = mongoose.model("Category", categorySchema);
const Expense = mongoose.model("Expense", expenseSchema);
const Income = mongoose.model("Income", incomeSchema);

module.exports = {
  User,
  Category,
  Expense,
  Income
};
