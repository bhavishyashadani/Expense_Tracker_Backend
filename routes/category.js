const Express = require("express");
const { Category } = require("../db");
const authMiddleware = require("../middleware/authentication");

const Router = Express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category operations
 */

/* ================= CREATE CATEGORY ================= */

/**
 * @swagger
 * /category/create:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cat_name
 *             properties:
 *               cat_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category created successfully
 *       400:
 *         description: Category name required or already exists
 */
Router.post("/create", authMiddleware, async function (req, res) {
  const { cat_name } = req.body;

  if (!cat_name) {
    return res.status(400).json("Category name required");
  }

  const existing = await Category.findOne({
    user_id: req.userId,
    cat_name
  });

  if (existing) {
    return res.status(400).json("Category already exists");
  }

  const category = await Category.create({
    cat_name,
    user_id: req.userId
  });

  res.json(category);
});

/* ================= DELETE CATEGORY ================= */

/**
 * @swagger
 * /category/delete/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with existing expenses
 *       404:
 *         description: Category not found
 */
Router.delete("/delete/:id", authMiddleware, async function (req, res) {
  const category = await Category.findOne({
    _id: req.params.id,
    user_id: req.userId
  });

  if (!category) {
    return res.status(404).json("Category not found");
  }

  if (category.cat_total > 0) {
    return res
      .status(400)
      .json("Cannot delete category with existing expenses");
  }

  await Category.findByIdAndDelete(category._id);

  const categories = await Category.find({
    user_id: req.userId
  });

  res.json(categories);
});

/* ================= LIST CATEGORIES ================= */

/**
 * @swagger
 * /category/list:
 *   get:
 *     summary: Get all categories for the user
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: A list of categories
 */
Router.get("/list", authMiddleware, async function (req, res) {
  const categories = await Category.find({
    user_id: req.userId
  });

  res.json(categories);
});

module.exports = Router;
