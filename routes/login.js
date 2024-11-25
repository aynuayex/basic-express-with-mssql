// const express = require("express");
// const router = express.Router();
const { Router } = require("express");
const router = Router();
const loginController = require("../controllers/loginController");

router.post('/',loginController.handleLogin);

module.exports = router;