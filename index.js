const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const expenseRoutes = require("./routes/expense");
const incomeRoutes = require("./routes/income");
const userRoutes=require("./routes/user");
require("dotenv").config();
const app = express();
const Port = process.env.PORT;
const Mongo_URL = process.env.MONGO_URI;
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/category", categoryRoutes);
app.use("/expense", expenseRoutes);
app.use("/income", incomeRoutes);
app.use("/user",userRoutes);

mongoose.connect(Mongo_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.listen(Port, () => {
  console.log("Server running");
});
