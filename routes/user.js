const Express = require("express");
const { User } = require("../db.js");
const authMiddleware = require("../middleware/authentication.js");

const Router = Express.Router();

/*
 GET /user/profile
 Protected route
*/
Router.get("/profile", authMiddleware, async function (req, res) {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json("User not found");
    }

    res.json({
      cashBalance: user.cashBalance,
      onlineBalance: user.onlineBalance,
      monthlyBudget: user.monthlyBudget
    });
  } catch (err) {
    res.status(500).json("Failed to fetch profile");
  }
});

module.exports = Router;
