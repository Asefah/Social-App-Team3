#!/usr/bin/env node

const { existsSync } = require("node:fs");
const net = require("node:net");
const { dirname } = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const bundledNode =
  "/Users/pragnyakunamneni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node";

const majorVersion = Number.parseInt(process.versions.node.split(".")[0], 10);
const WEB_PORT = 8081;
const API_PORT = 5050;

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });

const run = async () => {
  if (majorVersion < 22) {
    if (existsSync(bundledNode)) {
      const result = spawnSync(bundledNode, [__filename], {
        stdio: "inherit",
        env: {
          ...process.env,
          PATH: `${dirname(bundledNode)}:${process.env.PATH}`,
        },
      });

      process.exit(result.status ?? 1);
    }

    console.error(
      `HiveFive needs Node 22 or newer. You are using Node ${process.version}.`
    );
    console.error("Install Node 22+, then run `npm run dev` again.");
    process.exit(1);
  }

  let apiProcess;

  if (await isPortOpen(API_PORT)) {
    console.log(`HiveFive API is already running: http://localhost:${API_PORT}`);
  } else {
    apiProcess = spawn(process.execPath, ["backend/server.js"], {
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `${dirname(process.execPath)}:${process.env.PATH}`,
      },
    });
  }

  if (await isPortOpen(WEB_PORT)) {
    console.log(`HiveFive is already running: http://localhost:${WEB_PORT}`);
    return;
  }

  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["expo", "start", "--web", "--port", String(WEB_PORT)],
    { stdio: "inherit" }
  );

  apiProcess?.kill();
  process.exit(result.status ?? 1);
};

run();
