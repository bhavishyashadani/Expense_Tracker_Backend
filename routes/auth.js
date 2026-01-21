const Express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../db");

const secret = "mySecret";
const Router = Express.Router();

function isValidPassword(password) {
  if (!password) return false;
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

/* ================= SIGNUP ================= */

Router.post("/signup", async function (req, res) {
  const {
    uname,
    pass,
    userName,
    cashBalance,
    onlineBalance,
    monthlyBudget
  } = req.body;

  if (!isValidPassword(pass)) {
    return res.status(400).json("Password not in correct format");
  }

  // 🔒 budget constraint
  if (monthlyBudget > cashBalance + onlineBalance) {
    return res
      .status(400)
      .json("Monthly budget cannot exceed total balance");
  }

  try {
    const hashedPassword = await bcrypt.hash(pass, 10);

    await User.create({
      name: uname,
      userName,
      password: hashedPassword,
      cashBalance,
      onlineBalance,
      monthlyBudget
    });

    res.json("signedup");
  } catch (err) {
    res.status(400).json("Username already exists");
  }
});

/* ================= SIGNIN ================= */

Router.post("/signin", async function (req, res) {
  const { userName, pass } = req.body;

  const user = await User.findOne({ userName });

  if (!user) {
    return res.status(401).json("Wrong Credentials");
  }

  const isMatch = await bcrypt.compare(pass, user.password);

  if (!isMatch) {
    return res.status(401).json("Wrong Credentials");
  }

  const token = jwt.sign(
    { userId: user._id },
    secret,
    { expiresIn: "2h" }
  );

  res.json({ token });
});

module.exports = Router;
