#!/usr/bin/env node
/** Safe launcher for the personal fork; the upstream `parley` CLI is untouched. */
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2).flatMap((arg) => {
  if (arg.startsWith("--port=")) return ["--port", arg.slice("--port=".length)];
  if (arg.startsWith("--root=")) return ["--root", arg.slice("--root=".length)];
  return [arg];
});
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Parley Mine — isolated launcher for the personal fork.

Usage: parley-mine [--port N] [--root DIR] [--no-open] [--version] [--help]

Defaults: http://127.0.0.1:4142 and ~/.parley-fork`);
  process.exit(0);
}

// Explicit caller values always win. In particular, this launcher never
// inherits the fork server's normal 4141 / ~/.parley defaults.
if (!args.includes("--port")) args.push("--port", "4142");
if (!args.includes("--root")) args.push("--root", path.join(os.homedir(), ".parley-fork"));

const portIndex = args.indexOf("--port");
const requestedPort = Number(args[portIndex + 1]);
if (!args.includes("--version") && !args.includes("-v") && Number.isFinite(requestedPort) && requestedPort !== 0) {
  const url = `http://127.0.0.1:${requestedPort}`;
  const result = await probe(url);
  if (result.occupied) {
    if (result.isMine) {
      console.log(`Parley Mine is already running at ${url}; reusing it.`);
      if (!args.includes("--no-open")) openBrowser(url);
      process.exit(0);
    }
    console.error(`Cannot start Parley Mine: port ${requestedPort} is occupied by another service.`);
    process.exit(1);
  }
}

process.argv = [process.argv[0], fileURLToPath(new URL("../parley.mjs", import.meta.url)), ...args];
process.env.PARLEY_EXACT_PORT = "1";
await import("../parley.mjs");

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1200 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { if (body.length < 1_000_000) body += chunk; });
      res.on("end", () => resolve({
        occupied: true,
        isMine: res.statusCode === 200 && body.includes('class="fork-badge"') && body.includes('name="parley-token"'),
      }));
    });
    req.on("error", (error) => resolve({ occupied: error.code !== "ECONNREFUSED" && error.code !== "EHOSTUNREACH" }));
    req.on("timeout", () => req.destroy(Object.assign(new Error("probe timeout"), { code: "ETIMEDOUT" })));
  });
}

function openBrowser(url) {
  const [command, commandArgs] = process.platform === "win32"
    ? ["cmd.exe", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    const child = spawn(command, commandArgs, { detached: true, stdio: "ignore", windowsHide: true });
    child.on("error", () => { /* user can open the printed URL manually */ });
    child.unref();
  }
  catch { /* user can open the printed URL manually */ }
}
