import express from "express";
import { createLogger } from "@whatsapp-ai/logger";

const logger = createLogger("auth-service");
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.post("/api/auth/login", (req, res) => {
  res.json({ token: "placeholder-token", message: "Auth service placeholder" });
});

app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});

export default app;
