/** Browser audit for the conversation surfaces that are easy to miss in a
 * landing-page review. Every test owns an isolated server and fake providers. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, expect, createRoom, send, idle } from "./browser-fixture.mjs";

const auditDir = path.join(os.tmpdir(), "parley-ui-audit");
fs.mkdirSync(auditDir, { recursive: true });

async function screenshot(app, name) {
  await app.emulateMedia({ colorScheme: "dark" });
  await app.screenshot({ animations: "disabled", path: `${auditDir}/${name}.png`, fullPage: true });
}

async function fitsViewport(app, selector) {
  const box = await app.locator(selector).boundingBox();
  const viewport = app.viewportSize();
  expect(box, `${selector} should be laid out`).toBeTruthy();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}

test("mention picker supports keyboard selection and stays inside the composer", async ({ app, server }) => {
  await createRoom(app, server, "mention-panel");
  await app.setViewportSize({ width: 390, height: 844 });
  await app.locator("#input").fill("@co");
  await expect(app.locator("#mention")).toBeVisible();
  await fitsViewport(app, "#mention");
  await screenshot(app, "mention-picker-mobile");
  await app.locator("#input").press("ArrowDown");
  await app.locator("#input").press("Enter");
  await expect(app.locator("#input")).toHaveValue("@codex ");
});

test("file and image drafts can be added and removed without sending", async ({ app, server }) => {
  await createRoom(app, server, "attachment-panel");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await app.locator("#fileInput").setInputFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("private test notes") },
    { name: "tiny.png", mimeType: "image/png", buffer: png },
  ]);
  await expect(app.locator("#draftImages")).toHaveClass(/show/);
  await expect(app.locator(".draft-file")).toContainText("notes.txt");
  await expect(app.locator(".draft-image img")).toHaveAttribute("alt", "tiny.png");
  await fitsViewport(app, "#draftImages");
  await screenshot(app, "attachments-drafted");
  await app.locator('.draft-file button[title="Remove file"]').click();
  await app.locator('.draft-image button[title="Remove image"]').click();
  await expect(app.locator("#draftImages")).not.toHaveClass(/show/);
  await screenshot(app, "attachments-cleared");
});

test("hop, stop, and queue panels remain readable while work is active", async ({ app, server }) => {
  await createRoom(app, server, "action-panels");
  await app.setViewportSize({ width: 390, height: 844 });
  await app.locator("#hopBtn").click();
  await expect(app.locator("#hopMenu")).toBeVisible();
  await fitsViewport(app, "#hopMenu");
  await screenshot(app, "hop-menu-mobile");
  await app.locator('#hopMenu [data-hop-choice="solo"]').click();
  await expect(app.locator("#hopMenu")).toBeHidden();

  await send(app, "@codex READY:panel-stop SLEEP:20000 SAY:NEVER_FINISH");
  await expect.poll(() => fs.existsSync(`${server.root}/action-panels/workspace/.fake-cli-ready-panel-stop`)).toBe(true);
  await app.locator("#stopMore").click();
  await expect(app.locator("#stopMenu")).toBeVisible();
  await fitsViewport(app, "#stopMenu");
  await screenshot(app, "stop-menu-mobile");
  await app.locator('[data-stop-scope="active"]').click();
  await idle(server, "action-panels");

  await send(app, "@codex READY:panel-queue SLEEP:20000 SAY:FIRST");
  await expect.poll(() => fs.existsSync(`${server.root}/action-panels/workspace/.fake-cli-ready-panel-queue`)).toBe(true);
  await send(app, "@codex SAY:SECOND_QUEUED");
  await expect(app.locator("#queueBadge")).toBeVisible();
  await app.locator("#queueBadge").click();
  await expect(app.locator("#queuePop")).toBeVisible();
  await fitsViewport(app, "#queuePop");
  await screenshot(app, "queue-popover-mobile");
  await app.locator('[data-cancel-group=""]').click();
  await app.locator("#stopMore").click();
  await app.locator('[data-stop-scope="all"]').click();
  await idle(server, "action-panels");
});

test("Ask again and wake menus expose their choices", async ({ app, server }) => {
  await createRoom(app, server, "secondary-panels");
  await send(app, "@codex SAY:ASK_SOURCE");
  await idle(server, "secondary-panels");
  const ask = app.locator('.msg.agent.codex .ask').last();
  await expect(ask).toBeVisible();
  await ask.click();
  await expect(app.locator("#askMenu")).toBeVisible();
  await fitsViewport(app, "#askMenu");
  await expect(app.locator('[data-ask-mode="now"]')).toBeVisible();
  await screenshot(app, "ask-menu-desktop");
  await app.keyboard.press("Escape");
  await expect(app.locator("#askMenu")).toBeHidden();

  await send(app, "/sleep @claude", { route: "/api/seat/sleep" });
  await expect.poll(async () => (await server.room("secondary-panels")).room.agents.claude.asleep).toBe(true);
  await send(app, "@claude SAY:HELD_UNTIL_WAKE");
  await expect.poll(async () => (await server.room("secondary-panels")).room.agents.claude.held).toBeGreaterThan(0);
  await app.locator('.moon[data-seat="claude"]').click();
  await expect(app.locator("#wakeMenu")).toBeVisible();
  await fitsViewport(app, "#wakeMenu");
  await expect(app.locator('[data-wake="deliver"]')).toBeVisible();
  await expect(app.locator('[data-wake="only"]')).toBeVisible();
  await screenshot(app, "wake-menu-desktop");
  await app.locator('[data-wake="only"]').click();
  await expect(app.locator("#wakeMenu")).toBeHidden();
});

test("mobile navigation opens as a contained drawer and closes on the scrim", async ({ app, server }) => {
  await createRoom(app, server, "a-room-name-that-is-long-enough-to-test-");
  await app.setViewportSize({ width: 390, height: 844 });
  const titleBox = await app.locator("#roomTitle").boundingBox();
  const settingsBox = await app.locator("#settingsBtn").boundingBox();
  expect(Math.abs(titleBox.y - settingsBox.y)).toBeLessThan(15);
  expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(390);
  await app.locator("#navToggle").click();
  await expect(app.locator("body")).toHaveClass(/nav-open/);
  await expect(app.locator("#navScrim")).toBeVisible();
  await expect.poll(async () => (await app.locator("#sidebar").boundingBox())?.x ?? -999).toBeGreaterThanOrEqual(-1);
  await fitsViewport(app, "#sidebar");
  await screenshot(app, "mobile-sidebar-open");
  await app.mouse.click(380, 420);
  await expect(app.locator("body")).not.toHaveClass(/nav-open/);
  await expect(app.locator("#navScrim")).toBeHidden();
});
