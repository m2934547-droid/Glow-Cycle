import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

try {
  process.loadEnvFile(".env");
} catch {
  // Allow running purely from shell-provided env vars.
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Add it to .env or your shell environment first.",
  );
  process.exit(1);
}

function resolvePnpmCommand() {
  if (process.platform !== "win32") {
    return { command: "pnpm", argsPrefix: [] };
  }

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const corepackCmd = path.join(programFiles, "nodejs", "corepack.cmd");
  if (existsSync(corepackCmd)) {
    return { command: corepackCmd, argsPrefix: ["pnpm"] };
  }

  return { command: "pnpm.cmd", argsPrefix: [] };
}

const pnpmRuntime = resolvePnpmCommand();
const useForce = process.argv.includes("--force");
const dbCommand = useForce ? "push-force" : "push";
const commandArgs = [
  ...pnpmRuntime.argsPrefix,
  "--filter",
  "@workspace/db",
  "run",
  dbCommand,
];

const child = spawn(
  pnpmRuntime.command,
  commandArgs,
  {
    env: process.env,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("Failed to run database push command", error);
  process.exit(1);
});
