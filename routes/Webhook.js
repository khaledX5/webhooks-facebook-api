const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/WebhookController');
const auth = require('../middleware/AuthMiddleware')

router.get("/webhooks", WebhookController.verify_app);

//router.post("/auth/login", auth.login);
module.exports = router;
