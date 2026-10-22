/** Chromium regressions for the multi-agent roster and refreshed shell. */
import path from "node:path";
import { test, expect, send, idle } from "./browser-fixture.mjs";

test("creates four individually configured agents and keeps the roster readable", async ({ app, server }, testInfo) => {
  await app.locator("#addRoomBtn").click();
  await app.locator("#newRoomInput").fill("panel");
  await app.locator("#addSeatBtn").click();
  await app.locator("#addSeatBtn").click();
  const rows = app.locator(".roster-row");
  await expect(rows).toHaveCount(4);
  const names = ["builder", "astra", "adversary", "privacy"];
  for (let i = 0; i < names.length; i++) {
    await rows.nth(i).locator(".roster-name").fill(names[i]);
    await rows.nth(i).locator(".roster-model").fill(i === 1 ? "gpt-6-astra" : i === 0 ? "fable" : "");
    const effort = rows.nth(i).locator(".roster-effort");
    if (await effort.count()) await effort.fill(i === 1 ? "high" : "medium");
    await rows.nth(i).locator(".roster-instructions").fill(i === 2 ? "Challenge assumptions and look for failure modes." : i === 3 ? "Protect secrets and flag privacy risks." : `Role instructions for ${names[i]}.`);
  }
  await app.locator("#rosterList").evaluate((el) => { el.scrollTop = 0; });
  await app.screenshot({ path: "/private/tmp/parley-roster-desktop.png", fullPage: true });
  const accepted = app.waitForResponse((res) => new URL(res.url()).pathname === "/api/rooms" && res.request().method() === "POST");
  await app.locator("#newRoomCreate").click();
  expect((await accepted).status()).toBe(200);
  await expect(app.locator("#roomTitle")).toHaveText("panel");
  const snapshot = await server.room("panel");
  expect(snapshot.room.seats).toEqual(names);
  expect(snapshot.room.cfg.agents.adversary.instructions).toMatch(/failure modes/);
  expect(snapshot.room.cfg.agents.privacy.instructions).toMatch(/privacy risks/);
  await expect(app.locator("#seatChips")).toContainText("@privacy");
  await expect(app.locator('.chip[data-t="both"]')).toHaveText("@all");
  await server.configure("panel");
  await send(app, "@privacy SAY:Reviewed");
  await idle(server, "panel");
  await expect(app.locator(".msg.agent.privacy .bubble")).toContainText("Reviewed");
  await send(app, "@builder Prepare a release checklist. SHOWCASE");
  await idle(server, "panel");
  await expect(app.locator(".msg.agent.builder .bubble")).toContainText("Prepared the release checklist");
  await expect(app.locator(".msg.agent.builder .avatar")).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const selectedChip = app.locator('.chip.active[data-t="builder"]');
  await expect(selectedChip).toBeVisible();
  const chipColors = await selectedChip.evaluate((el) => ({ foreground: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
  expect(chipColors.foreground).not.toBe(chipColors.background);

  const out = path.join(testInfo.outputDir, "roster-desktop.png");
  await app.screenshot({ path: out, fullPage: true });
  await testInfo.attach("roster-desktop.png", { path: out, contentType: "image/png" });
  await app.screenshot({ path: "/private/tmp/parley-chat-desktop.png" });
  await app.emulateMedia({ colorScheme: "dark" });
  await app.screenshot({ path: "/private/tmp/parley-chat-dark.png" });
});

test("persists per-agent instructions in settings and wraps menus on a narrow viewport", async ({ app, server }, testInfo) => {
  await app.setViewportSize({ width: 390, height: 844 });
  await app.locator("#settingsBtn").click();
  await expect(app.locator("#overlay")).toHaveClass(/open/);
  const cards = app.locator('#seatCards textarea[data-f="instructions"]');
  await expect(cards.first()).toBeVisible();
  await cards.first().fill("Privacy reviewer: redact secrets and personal data.");
  const save = app.waitForResponse((res) => new URL(res.url()).pathname === "/api/config" && res.request().method() === "POST");
  await app.locator("#mSave").click();
  expect((await save).status()).toBe(200);
  const snapshot = await server.room("default");
  expect(snapshot.room.cfg.agents[snapshot.room.seats[0]].instructions).toMatch(/redact secrets/);

  await app.locator("#hopBtn").click();
  await expect(app.locator("#hopMenu")).toBeVisible();
  const box = await app.locator("#hopMenu").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  const out = path.join(testInfo.outputDir, "roster-narrow.png");
  await app.screenshot({ path: out, fullPage: true });
  await testInfo.attach("roster-narrow.png", { path: out, contentType: "image/png" });
  await app.screenshot({ path: "/private/tmp/parley-roster-narrow.png" });
});

test("mobile room dialog supports one agent, keyboard dismissal and reopening", async ({ app, server }) => {
  await app.setViewportSize({ width: 390, height: 844 });
  await app.locator("#navToggle").click();
  await app.locator("#addRoomBtn").click();
  const dialog = app.locator("#newRoomDialog");
  await expect(dialog).toBeVisible();
  await expect(app.locator("#newRoomInput")).toBeFocused();
  await app.locator(".roster-remove").last().click();
  await expect(app.locator("#newRoomReview")).toBeHidden();
  await app.locator("#newRoomInput").fill("solo-room");
  await app.locator("#seat1Name").fill("privacy");
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await app.screenshot({ path: "/private/tmp/parley-dialog-mobile.png" });
  await app.locator("#newRoomCreate").click();
  await expect(app.locator("#roomTitle")).toHaveText("solo-room");
  expect((await server.room("solo-room")).room.seats).toEqual(["privacy"]);
  await app.locator("#navToggle").click();
  await app.locator("#addRoomBtn").click();
  await expect(app.locator(".roster-row")).toHaveCount(2);
  await app.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("legacy first-two selectors still create a same-provider room", async ({ app, server }) => {
  await app.locator("#addRoomBtn").click();
  await app.locator("#newRoomInput").fill("legacy-roster");
  await app.locator("#seat2").selectOption("claude");
  await app.locator("#seat1Name").fill("builder");
  await app.locator("#seat2Name").fill("reviewer");
  const accepted = app.waitForResponse((res) => new URL(res.url()).pathname === "/api/rooms" && res.request().method() === "POST");
  await app.locator("#seat2Name").press("Enter");
  expect((await accepted).status()).toBe(200);
  expect((await server.room("legacy-roster")).room.seats).toEqual(["builder", "reviewer"]);
});

test("switching rooms refreshes agents after an unchanged first pair", async ({ app, server }) => {
  const seats = [{ id: "claude", provider: "claude" }, { id: "codex", provider: "codex" }, { id: "privacy", provider: "claude" }];
  expect((await server.api("POST", "/api/rooms", { name: "expanded", seats })).status).toBe(200);
  await app.reload();
  await app.locator('.room-item .ropen').filter({ hasText: "expanded" }).click();
  await expect(app.locator("#roomTitle")).toHaveText("expanded");
  await expect(app.locator("#pills .pill")).toHaveCount(3);
  await expect(app.locator('#seatChips [data-t="privacy"]')).toBeVisible();
  await app.locator('.room-item .ropen').filter({ hasText: "default" }).click();
  await expect(app.locator("#roomTitle")).toHaveText("default");
  await expect(app.locator("#pills .pill")).toHaveCount(2);
  await expect(app.locator('#seatChips [data-t="privacy"]')).toHaveCount(0);
});

test("an eight-agent roster stays valid after removing and replacing a seat", async ({ app, server }) => {
  await app.locator("#addRoomBtn").click();
  await app.locator("#newRoomInput").fill("full-table");
  for (let i = 0; i < 6; i++) await app.locator("#addSeatBtn").click();
  await expect(app.locator(".roster-row")).toHaveCount(8);
  await expect(app.locator("#addSeatBtn")).toBeDisabled();
  await app.locator(".roster-remove").nth(2).click();
  await app.locator("#addSeatBtn").click();
  const names = await app.locator(".roster-name").evaluateAll((inputs) => inputs.map((input) => input.value));
  expect(new Set(names).size).toBe(8);
  await app.locator("#newRoomCreate").click();
  await expect(app.locator("#roomTitle")).toHaveText("full-table");
  expect((await server.room("full-table")).room.seats).toEqual(names);
  await expect(app.locator("#pills .pill")).toHaveCount(8);
});
