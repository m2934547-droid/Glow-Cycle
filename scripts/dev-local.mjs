import { spawn } from "node:child_process";

try {
  process.loadEnvFile(".env");
} catch {
  // Allow running purely from shell-provided env vars.
}

const pnpmCmd = process.platform === "win32" ? "corepack" : "pnpm";
const apiPort = process.env.API_PORT ?? process.env.PORT ?? "8081";
const webPort = process.env.WEB_PORT ?? "8080";

const sharedEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => typeof value === "string"),
);

Object.assign(sharedEnv, {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  API_PORT: apiPort,
  WEB_PORT: webPort,
  BASE_PATH: process.env.BASE_PATH ?? "/",
  API_SERVER_URL: process.env.API_SERVER_URL ?? `http://localhost:${apiPort}`,
});

const children = [];

function start(name, args) {
  const commandArgs =
    process.platform === "win32" ? ["pnpm", ...args] : args;

  const child = spawn(pnpmCmd, commandArgs, {
    env: sharedEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  children.push(child);

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exitCode = 1;
      stopAll(signal);
      return;
    }

    if (code && code !== 0) {
      process.exitCode = code;
      stopAll("SIGTERM");
    }
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start`, error);
    process.exitCode = 1;
    stopAll("SIGTERM");
  });
}

let isShuttingDown = false;

function stopAll(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

start("api", ["--filter", "@workspace/api-server", "run", "dev"]);
start("web", ["--filter", "@workspace/glowcycle", "run", "dev"]);
