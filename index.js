const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const expenseRoutes = require("./routes/expense");
const incomeRoutes = require("./routes/income");
const userRoutes=require("./routes/user");
require("dotenv").config();
const app = express();
const Port = process.env.PORT || 5000;
const Mongo_URL = process.env.MONGO_URI;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      version: '1.0.0',
      description: 'Complete API documentation for the Expense Tracker backend',
    },
    servers: [
      {
        url: `http://localhost:${Port}`,
      },
      {
        url: 'https://smartspend-ai-9wkc.onrender.com', // Production URL
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors({ origin: "https://smartspend-ai-9wkc.onrender.com" })); // using object for cors config
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
