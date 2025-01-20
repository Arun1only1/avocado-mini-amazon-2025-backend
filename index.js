import express from "express";
import connectDB from "./db.connection.js";
import { userController } from "./user/user.controller.js";

// backend app
const app = express();

// to make app understand json
app.use(express.json());

// connect database
await connectDB();

// register routes/controller
app.use(userController);

// network port
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
