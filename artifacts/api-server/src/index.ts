import http from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { setupSocketIO } from "./socket";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create a plain HTTP server so Socket.IO can share it with Express
const httpServer = http.createServer(app);

// Attach Socket.IO to the HTTP server
setupSocketIO(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
