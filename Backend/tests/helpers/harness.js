import { spawn } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

/* Integration harness: a throwaway mongod, the real express routes and the real
   socket.io server. Nothing is mocked, so a passing test means the persistence
   path actually works end to end. */

export const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

const canConnect = (port) =>
  new Promise((resolve) => {
    const sock = net.connect(port, "127.0.0.1");
    sock.on("connect", () => sock.end(resolve.bind(null, true)));
    sock.on("error", () => resolve(false));
  });

const waitForPort = async (port, timeoutMs = 30000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(port)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`nothing listening on port ${port} after ${timeoutMs}ms`);
};

export const startMongo = async () => {
  const port = await freePort();
  const dbPath = await fs.mkdtemp(path.join(os.tmpdir(), "vc-chat-test-"));

  const proc = spawn(
    "mongod",
    ["--dbpath", dbPath, "--port", String(port), "--bind_ip", "127.0.0.1"],
    { stdio: "ignore" }
  );
  proc.on("error", (err) => {
    console.error("mongod failed to spawn:", err.message);
  });

  await waitForPort(port);

  return {
    uri: `mongodb://127.0.0.1:${port}/vc_chat_test`,
    stop: async () => {
      proc.kill("SIGTERM");
      await new Promise((r) => proc.once("exit", r));
      await fs.rm(dbPath, { recursive: true, force: true });
    },
  };
};
