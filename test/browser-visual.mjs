/** Render the conversation and status surfaces against fake providers only. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, expect, createRoom, send, idle } from "./browser-fixture.mjs";

const auditDir = path.join(os.tmpdir(), "parley-ui-audit");
fs.mkdirSync(auditDir, { recursive: true });

test("conversation, activity, banners and recovery remain readable across themes", async ({ app, server }) => {
  await createRoom(app, server, "visual-review");
  await server.configure("visual-review", { mode: "work" });
  await app.reload();
  await expect(app.locator("#workBanner")).toBeVisible();
  await send(app, "@claude WRITE:review.txt");
  await idle(server, "visual-review");
  await send(app, "@codex Prepare a release checklist. SHOWCASE");
  await idle(server, "visual-review");
  await expect(app.locator("#chat")).toContainText("Prepared the release checklist");
  for (const theme of ["dark", "light"]) {
    await app.emulateMedia({ colorScheme: theme });
    for (const width of [1440, 390]) {
      await app.setViewportSize({ width, height: 1000 });
      expect(await app.locator("#main").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await app.locator("#chat > *").last().scrollIntoViewIfNeeded();
      await app.screenshot({ animations: "disabled", path: `${auditDir}/conversation-${theme}-${width}.png` });
    }
  }
  await send(app, "@claude ## Review notes\n\n- Keep each agent's instructions separate.\n- Check the settings before starting work.\n\n> A long reference should stay inside its message.\n\n```js\nconst reference = '" + "abcdefgh01234567".repeat(20) + "';\n```\n\nSAY:ACKNOWLEDGED");
  await idle(server, "visual-review");
  const richMessage = app.locator(".msg.user").filter({ hasText: "Review notes" });
  await expect(richMessage.locator("pre")).toBeVisible();
  await richMessage.scrollIntoViewIfNeeded();
  expect(await app.locator("#chatWrap").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await app.screenshot({ animations: "disabled", path: `${auditDir}/markdown-long-code-light-390.png` });
  await app.setViewportSize({ width: 1440, height: 1000 });
  await app.emulateMedia({ colorScheme: "dark" });
  await send(app, "@claude FAILONCESEAT:claude SAY:RECOVERY");
  await idle(server, "visual-review");
  const retry = app.locator(".sysmsg.err").getByRole("button", { name: /^Retry/ }).last();
  await expect(retry).toBeVisible();
  await retry.scrollIntoViewIfNeeded();
  await app.screenshot({ animations: "disabled", path: `${auditDir}/error-recovery-dark-1440.png` });
  await retry.click();
  await idle(server, "visual-review");
  await expect(app.locator("#chat")).toContainText("RECOVERY");
  await send(app, "/pair start @claude SLEEP:20000 SAY:PAIR_WORKING");
  await expect(app.locator("#pairBanner")).toBeVisible();
  await expect(app.locator('[data-live-agent="claude"]')).toBeVisible();
  await app.locator('[data-live-agent="claude"]').scrollIntoViewIfNeeded();
  await app.screenshot({ animations: "disabled", path: `${auditDir}/pair-active-dark-1440.png` });
  await app.setViewportSize({ width: 390, height: 844 });
  await app.screenshot({ animations: "disabled", path: `${auditDir}/pair-active-dark-390.png` });
  await app.emulateMedia({ colorScheme: "light" });
  await app.screenshot({ animations: "disabled", path: `${auditDir}/pair-active-light-390.png` });
  await app.locator("#stopMore").click();
  await app.locator('[data-stop-scope="all"]').click();
  await idle(server, "visual-review");
});

test("setup and runtime warning screens fit in a compact viewport", async ({ page, server }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await server.api("POST", "/api/config", { room: "default", config: { agents: { claude: { command: "__missing_parley_cli__" } } } });
  await page.goto(server.url);
  await expect(page.locator("#setupBanner")).toBeVisible();
  expect(await page.locator("#setupBanner").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ animations: "disabled", path: `${auditDir}/setup-warning-dark-390.png` });
  await page.route(server.url + "/", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace('name="parley-runtime-protocol" content="13"', 'name="parley-runtime-protocol" content="12"');
    await route.fulfill({ response, body });
  });
  await page.reload();
  await expect(page.locator("#runtimeBanner")).toBeVisible();
  await expect(page.locator("#input")).toBeDisabled();
  expect(await page.locator("#runtimeBanner").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ animations: "disabled", path: `${auditDir}/runtime-warning-dark-390.png` });
});
