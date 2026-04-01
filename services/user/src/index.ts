import express from "express";
import { createLogger } from "@whatsapp-ai/logger";

const logger = createLogger("user-service");
const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

app.get("/api/users/:id", (req, res) => {
  res.json({ id: req.params.id, message: "User service placeholder" });
});

app.listen(PORT, () => {
  logger.info(`User service running on port ${PORT}`);
});

export default app;
