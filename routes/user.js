const Express = require("express");
const { User } = require("../db.js");
const authMiddleware = require("../middleware/authentication.js");

const Router = Express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User operations
 */

/*
 GET /user/profile
 Protected route
*/

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile information
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User profile details
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch profile
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
