import e from "express";
const r = e.Router();
import c from "../controllers/payController.js";
r.post("/", c.pay);
r.post("/payfast", c.createPayfastCheckout);
r.post("/payfast/notify", e.urlencoded({ extended: false }), c.payfastNotify);
export default r;
