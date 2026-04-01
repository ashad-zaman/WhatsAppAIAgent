import express from "express";
import { createLogger } from "@whatsapp-ai/logger";

const logger = createLogger("billing-service");
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "billing-service" });
});

app.get("/api/billing/:userId", (req, res) => {
  res.json({
    userId: req.params.userId,
    message: "Billing service placeholder",
  });
});

app.listen(PORT, () => {
  logger.info(`Billing service running on port ${PORT}`);
});

export default app;
