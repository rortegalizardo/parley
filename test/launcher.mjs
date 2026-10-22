#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const launcher = path.join(project, "bin", "parley-mine.mjs");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "parley-mine-test-"));
const fakeHome = path.join(temp, "home");
fs.mkdirSync(fakeHome);
const children = [];
const childEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  /^(SystemRoot|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|LANG|LC_ALL)$/i.test(key)));
Object.assign(childEnv, {
  HOME: fakeHome,
  USERPROFILE: fakeHome,
  APPDATA: fakeHome,
  LOCALAPPDATA: fakeHome,
  CODEX_HOME: path.join(fakeHome, ".codex"),
  CLAUDE_CONFIG_DIR: path.join(fakeHome, ".claude"),
  PATH: [path.dirname(process.execPath), ...(process.platform === "win32"
    ? [path.join(process.env.SystemRoot || "C:\\Windows", "System32")] : ["/usr/bin", "/bin"])].join(path.delimiter),
});

async function start(args, expectedRoot) {
  const child = spawn(process.execPath, [launcher, ...args, "--no-open"], {
    cwd: temp,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  children.push(child);
  let output = "";
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error(`Launcher readiness timed out: ${output}`)), 10_000);
    const read = (chunk) => {
      output += chunk;
      const found = /UI:\s+(http:\/\/127\.0\.0\.1:\d+)/.exec(output)?.[1];
      if (found) { clearTimeout(timer); resolve(found); }
    };
    child.stdout.on("data", read);
    child.stderr.on("data", read);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => { clearTimeout(timer); reject(Error(`Launcher exited ${code}: ${output}`)); });
  });
  assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.ok(output.includes(`Rooms:  ${expectedRoot}`), `expected isolated root ${expectedRoot}: ${output}`);
  const response = await fetch(url);
  assert.equal(response.status, 200);
  await response.body?.cancel();
  return url;
}

function runOnce(args, entry = launcher, env = childEnv) {
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: temp, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  children.push(child);
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(Error(`Launcher did not exit promptly: ${output}`)), 5_000);
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("close", (code) => { clearTimeout(timer); resolve({ code, output }); });
  });
}

try {
  const defaultRoot = path.join(fakeHome, ".parley-fork");
  const existingUrl = await start(["--port", "0"], defaultRoot);
  assert.ok(fs.existsSync(defaultRoot), "default root is created beneath the fake home");
  assert.ok(!fs.existsSync(path.join(fakeHome, ".parley")), "original default library remains untouched");

  const duplicateRoot = path.join(temp, "must-not-be-created");
  const duplicate = await runOnce(["--port", new URL(existingUrl).port, "--root", duplicateRoot, "--no-open"]);
  assert.equal(duplicate.code, 0, duplicate.output);
  assert.match(duplicate.output, /already running at http:\/\/127\.0\.0\.1:/);
  assert.ok(!fs.existsSync(duplicateRoot), "duplicate launch does not start against a second root");

  const overrideRoot = path.join(temp, "explicit-library");
  await start(["--port", "0", "--root", overrideRoot], overrideRoot);
  assert.ok(fs.existsSync(overrideRoot), "explicit root is honored");

  const equalRoot = path.join(temp, "equal-form-library");
  await start([`--port=0`, `--root=${equalRoot}`], equalRoot);
  assert.ok(fs.existsSync(equalRoot), "equals-form root is honored");

  const help = spawnSync(process.execPath, [launcher, "--help"], { encoding: "utf8", env: childEnv });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /4142/);
  const version = spawnSync(process.execPath, [launcher, "--version"], { cwd: project, encoding: "utf8", env: childEnv });
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+/);

  const unrelated = http.createServer((_req, res) => { res.end("not Parley"); });
  await new Promise((resolve, reject) => unrelated.listen(0, "127.0.0.1", resolve).once("error", reject));
  try {
    const unrelatedPort = unrelated.address().port;
    const collision = await runOnce(["--port", String(unrelatedPort), "--no-open"]);
    assert.equal(collision.code, 1, collision.output);
    assert.match(collision.output, new RegExp(`port ${unrelatedPort} is occupied by another service`));

    const exactEnv = { ...childEnv, PARLEY_EXACT_PORT: "1" };
    const directCollision = await runOnce([
      "--port", String(unrelatedPort), "--root", path.join(temp, "exact-port-library"), "--no-open",
    ], path.join(project, "parley.mjs"), exactEnv);
    assert.equal(directCollision.code, 1, directCollision.output);
    assert.match(directCollision.output, /Failed to start:/);
    assert.ok(!directCollision.output.includes("UI:"), "exact-port mode does not increment to another port");
  } finally {
    await new Promise((resolve, reject) => unrelated.close((error) => error ? reject(error) : resolve()));
  }
  console.log("Safe launcher verified: isolation, duplicate prevention, occupied-port error, help and version.");
} finally {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => {
        child.once("close", resolve);
        child.kill("SIGTERM");
      });
    }
  }
  const resolved = path.resolve(temp);
  assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
