const r = require("express").Router();
const c = require("../controllers/authController");
r.post("/login", c.login);
r.post("/register", c.register);
r.get("/me", c.me);
module.exports = r;
