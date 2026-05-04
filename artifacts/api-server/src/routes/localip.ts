// Returns local network IP addresses so the frontend can display them
// for the Local Hotspot multiplayer setup instructions
import os from "node:os";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/local-ip", (_req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; address: string }[] = [];

  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces ?? []) {
      // Only IPv4, non-internal (skip loopback 127.x.x.x)
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }

  res.json({ addresses });
});

export default router;
