import express from "express";
import * as c from "../controllers/authController.js";

const r = express.Router();

r.post("/login", c.login);
r.post("/register", c.register);
r.get("/me", c.me);
r.get("/profile", c.profile);

export default r;
