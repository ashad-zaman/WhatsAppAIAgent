import express from "express";
import { createLogger } from "@whatsapp-ai/logger";

const logger = createLogger("notification-service");
const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.post("/api/notify", (req, res) => {
  res.json({ success: true, message: "Notification service placeholder" });
});

app.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
});

export default app;
