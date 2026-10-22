/** Full visual and interaction audit for Settings and room creation surfaces. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, expect, createRoom } from "./browser-fixture.mjs";

const auditDir = path.join(os.tmpdir(), "parley-ui-audit");
fs.mkdirSync(auditDir, { recursive: true });

for (const theme of ["light", "dark"]) {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    test(`settings and room builder fit at ${viewport.width} ${theme}`, async ({ app }) => {
      await app.setViewportSize(viewport);
      await app.emulateMedia({ colorScheme: theme });
      await app.locator("#settingsBtn").click();
      const modal = app.locator("#overlay .modal");
      await expect(modal).toBeVisible();
      expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect(await modal.evaluate((el) => el.scrollHeight >= el.clientHeight)).toBe(true);
      await app.screenshot({ animations: "disabled", path: `${auditDir}/settings-${theme}-${viewport.width}.png`, fullPage: true });

      const modelInput = app.locator('#seatCards input[data-f="model"]').first();
      if (await modelInput.count()) {
        const toggle = modelInput.locator("xpath=..//button[contains(@class,'freecombo-toggle')]");
        await toggle.click();
        await expect(modelInput.locator("xpath=..//div[contains(@class,'freecombo-menu')]")).toBeVisible();
        await app.screenshot({ animations: "disabled", path: `${auditDir}/settings-${theme}-${viewport.width}-model-open.png`, fullPage: true });
        const option = modelInput.locator("xpath=..//button[contains(@class,'freecombo-option') and not(@hidden)]").first();
        if (await option.count()) {
          const value = await option.getAttribute("data-combo-value");
          await option.click();
          await expect(modelInput).toHaveValue(value);
        }
      }
      const effortInput = app.locator('#seatCards input[data-f="effort"]').first();
      if (await effortInput.count()) {
        await effortInput.locator("xpath=..//button[contains(@class,'freecombo-toggle')]").click();
        await expect(effortInput.locator("xpath=..//div[contains(@class,'freecombo-menu')]")).toBeVisible();
        await app.screenshot({ animations: "disabled", path: `${auditDir}/settings-${theme}-${viewport.width}-effort-open.png`, fullPage: true });
        await app.keyboard.press("Escape");
      }
      await modal.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await app.screenshot({ animations: "disabled", path: `${auditDir}/settings-${theme}-${viewport.width}-lower.png`, fullPage: true });
      await app.locator("#mCancel").click();

      await app.locator("#fourAgentBtn").click();
      await expect(app.locator(".roster-row")).toHaveCount(4);
      expect(await app.locator("#newRoomDialog").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await app.screenshot({ animations: "disabled", path: `${auditDir}/new-room-four-${theme}-${viewport.width}.png`, fullPage: true });
      await app.keyboard.press("Escape");
      await expect(app.locator("#newRoomDialog")).toBeHidden();
    });
  }
}

test("room builder scales from one to eight agents and keeps the footer reachable", async ({ app }) => {
  await app.setViewportSize({ width: 390, height: 844 });
  await app.emulateMedia({ colorScheme: "dark" });
  await app.locator("#buildRoomBtn").click();
  await app.locator(".roster-remove").last().click();
  await expect(app.locator(".roster-row")).toHaveCount(1);
  await expect(app.locator("#newRoomReview")).toBeHidden();
  await app.locator("#addSeatBtn").click();
  for (let i = 0; i < 6; i++) await app.locator("#addSeatBtn").click();
  await expect(app.locator(".roster-row")).toHaveCount(8);
  const dialog = app.locator("#newRoomDialog");
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const footer = app.locator("#newRoomCreate");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
  await app.screenshot({ animations: "disabled", path: `${auditDir}/new-room-eight-dark-390.png`, fullPage: true });
  await dialog.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await app.screenshot({ animations: "disabled", path: `${auditDir}/new-room-eight-dark-390-lower.png`, fullPage: true });
  await app.keyboard.press("Escape");
});

test("settings save, rename, archive, and delete cancellation paths remain reachable", async ({ app, server }) => {
  await createRoom(app, server, "dialog-audit");
  await app.locator("#settingsBtn").click();
  await app.locator("#s_roomnote").fill("Audit note");
  const save = app.waitForResponse((res) => new URL(res.url()).pathname === "/api/config" && res.request().method() === "POST");
  await app.locator("#mSave").click();
  expect((await save).status()).toBe(200);
  await expect(app.locator("#overlay")).not.toHaveClass(/open/);
  await app.locator("#settingsBtn").click();

  const cancelDialog = (action) => new Promise(async (resolve) => {
    const handler = (dialog) => { dialog.dismiss().then(resolve); };
    app.once("dialog", handler);
    await action();
  });
  await cancelDialog(() => app.locator("#mNewConv").click());
  await expect(app.locator("#overlay")).toHaveClass(/open/);
  await cancelDialog(() => app.locator("#mDelete").click());
  await expect(app.locator("#overlay")).toHaveClass(/open/);

  let promptSeen = false;
  let confirmSeen = false;
  const renameHandler = async (dialog) => {
    if (dialog.type() === "prompt") { promptSeen = true; await dialog.accept("dialog-renamed"); }
    else { confirmSeen = true; await dialog.accept(); }
  };
  app.on("dialog", renameHandler);
  await app.locator("#mRename").click();
  await expect.poll(() => promptSeen).toBe(true);
  await expect.poll(() => confirmSeen).toBe(true);
  app.off("dialog", renameHandler);
  await expect(app.locator("#roomTitle")).toHaveText("dialog-renamed");
  await app.locator("#settingsBtn").click();
  await app.screenshot({ animations: "disabled", path: `${auditDir}/settings-renamed-light-1440.png`, fullPage: true });
});

test("mobile sidebar settings closes navigation before opening the overlay", async ({ app }) => {
  await app.setViewportSize({ width: 390, height: 844 });
  await app.emulateMedia({ colorScheme: "dark" });
  await app.locator("#navToggle").click();
  await expect(app.locator("body")).toHaveClass(/nav-open/);
  await app.locator("#settingsBtn2").click();
  await expect(app.locator("body")).not.toHaveClass(/nav-open/);
  await expect(app.locator("#navScrim")).toBeHidden();
  await expect(app.locator("#overlay")).toHaveClass(/open/);
  await app.screenshot({ animations: "disabled", path: `${auditDir}/settings-from-mobile-sidebar-dark-390.png`, fullPage: true });
  await app.locator("#mCancel").click();
});
