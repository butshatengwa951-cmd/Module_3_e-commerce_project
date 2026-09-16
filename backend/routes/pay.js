const e = require("express");
const r = e.Router();
const c = require("../controllers/payController");
r.post("/", c.pay);
r.post("/payfast", c.createPayfastCheckout);
r.post("/payfast/notify", e.urlencoded({ extended: false }), c.payfastNotify);
module.exports = r;
