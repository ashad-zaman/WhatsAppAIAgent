import express from "express";
import { createLogger } from "@whatsapp-ai/logger";

const logger = createLogger("document-service");
const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "document-service" });
});

app.get("/api/documents/:id", (req, res) => {
  res.json({ id: req.params.id, message: "Document service placeholder" });
});

app.listen(PORT, () => {
  logger.info(`Document service running on port ${PORT}`);
});

export default app;
