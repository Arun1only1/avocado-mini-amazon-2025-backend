import express from "express";
import UserTable from "./user.model.js";
import bcrypt from "bcrypt";

const router = express.Router();

// point to remember
// check if user with provided email already exits
// hash password, do not store plain password

router.post("/user/register", async (req, res) => {
  // extract new user from req.body
  const newUser = req.body;

  //   find user with email
  const user = await UserTable.findOne({ email: newUser.email });

  // if user, throw error
  if (user) {
    return res.status(409).send({ message: "User already exists." });
  }

  // hash password
  // requirement:plain password, saltRound
  const plainPassword = newUser.password;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  //   replace plain password with hashed password
  newUser.password = hashedPassword;

  //   create user
  await UserTable.create(newUser);

  return res.status(201).send({ message: "User is registered successfully." });
});

export { router as userController };
