const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { tokenVerify } = require("./middlewares");
const { check, validationResult } = require("express-validator");

router.post("/user/home", tokenVerify, (req, res) => {
  res.status(201).send("home page...");
});
router.post(
  "/user/register",
  [
    check("name").not().isEmpty().withMessage("name is required"),
    check("email").isEmail().withMessage("required valid email"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("password is of minimum of length 6"),
    check("contact")
      .isLength({ min: 10, max: 10 })
      .withMessage("mobile number of 10 digits"),
    check("role").not().isEmpty().withMessage("role is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).send({ errors: errors.array() });
    }
    const data = await User.findOne({ email: req.body.email });
    if (data) {
      return res.status(401).send("email already exist...");
    }

    const salt = await bcrypt.genSalt(10);
    const secpass = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      name: req.body.name,

      email: req.body.email,
      password: secpass,
      contact: req.body.contact,
      role: req.body.role,
    });
    const newuser = await user.save();
    console.log("user", newuser);
    return res.status(201).send({ message: "user created successfully...." });
  }
);

router.post(
  "/user/login",

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).send({ errors: errors.array() });
    }
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign(
          { _id: user._id, role: user.role },
          process.env.SECRET_KEY,
          {
            expiresIn: "5h",
          }
        );
        //  const { name, email, password, role } = user
        return res.status(201).send({
          token: token,
          user: user,
        });

        return res
          .status(201)
          .send({ message: "login successfully.", data: user });
      }
      return res.status(401).send({ message: "invalid user..." });
    }
    return res.status(401).send({ message: "user doesn't exist..." });
  }
);
module.exports = router;
