/** Composer contract for arbitrary rosters and the @all convergence default. */
import { test, expect, createRoom, send, idle } from "./browser-fixture.mjs";

// Exercise the production default. Legacy suites opt into their explicit
// parallel compatibility mode through the shared fixture.
test.use({ discussionMode: null });

test("large rosters use a searchable compact agent picker", async ({ app, server }, testInfo) => {
  await createRoom(app, server, "many-agents");
  await app.locator("#addRoomBtn").click();
  await app.locator("#newRoomInput").fill("many-agents-8");
  for (let i = 0; i < 7; i++) await app.locator("#addSeatBtn").click();
  const rows = app.locator(".roster-row");
  await expect(rows).toHaveCount(9);
  for (let i = 0; i < 9; i++) await rows.nth(i).locator(".roster-name").fill(`agent${i + 1}`);
  await rows.nth(8).locator(".roster-instructions").fill("Protect privacy and redact personal data.");
  await app.locator("#newRoomCreate").click();
  await expect(app.locator("#agentsBtn")).toContainText("9");
  await expect(app.locator("#seatChips .chip")).toHaveCount(0);
  await app.locator("#agentsBtn").click();
  await expect(app.locator("#agentsMenu")).toBeVisible();
  await expect(app.locator("#agentsSearch")).toBeFocused();
  await app.locator("#agentsSearch").fill("personal data");
  await expect(app.locator('[data-agent-target="agent9"]')).toBeVisible();
  await expect(app.locator('[data-agent-target="agent1"]')).toBeHidden();
  await app.locator('[data-agent-target="agent9"]').click();
  await expect(app.locator("#agentsBtnLabel")).toHaveText("@agent9");
  for (const [name, width, scheme] of [["desktop-light", 1440, "light"], ["mobile-light", 390, "light"], ["desktop-dark", 1440, "dark"], ["mobile-dark", 390, "dark"]]) {
    await app.setViewportSize({ width, height: 900 });
    await app.emulateMedia({ colorScheme: scheme });
    await testInfo.attach(name, { body: await app.screenshot({ animations: "disabled" }), contentType: "image/png" });
  }
});

test("a real @all request renders the backend convergence outcome", async ({ app, server }) => {
  await createRoom(app, server, "real-convergence");
  await app.locator('.chip[data-t="both"]').click();
  await send(app, "@all Produce one concise recommendation.");
  await idle(server, "real-convergence");
  await expect(app.locator("#convergencePanel")).toBeVisible();
  await expect(app.locator("#convergencePanel .convergence-status")).toContainText(/Agreed|Unresolved|Incomplete|Stopped|in progress/i);
  await expect(app.locator("#convergencePanel")).toContainText(/agent calls/);
});

test("@all defaults to one convergence handoff and exposes explicit parallel mode", async ({ app, server }) => {
  await createRoom(app, server, "convergence");
  await app.locator('.chip[data-t="both"]').click();
  await expect(app.locator("#routeHint")).toContainText("one agreed handoff");
  await expect(app.locator("#hopWrap")).toBeHidden();
  await app.locator("#agentsBtn").click();
  await expect(app.locator('[data-discussion-mode="converge"]')).toHaveAttribute("aria-checked", "true");
  await app.locator('[data-discussion-mode="parallel"]').click();
  await expect(app.locator('[data-discussion-mode="parallel"]')).toHaveAttribute("aria-checked", "true");
  await expect(app.locator("#routeHint")).toContainText("parallel replies");
  await expect(app.locator("#hopWrap")).toBeVisible();
  await expect(app.locator("#convergenceRoundsWrap")).toBeHidden();
  await app.locator('[data-discussion-mode="converge"]').click();
  await expect(app.locator("#hopWrap")).toBeHidden();
  const menuBounds = await app.locator("#agentsMenu").boundingBox();
  const pickerBounds = await app.locator("#agentsBtn").boundingBox();
  expect(menuBounds.y + menuBounds.height).toBeLessThanOrEqual(pickerBounds.y);
  await app.locator("#input").fill("@all Plan the change");
  await expect(app.locator("#routeHint")).toContainText("one agreed handoff");
  await expect(app.locator("#hopWrap")).toBeHidden();
  await app.locator("#convergenceRounds").fill("3");
  await app.locator("#convergenceRounds").press("Tab");
  await expect(app.locator("#routeHint")).toContainText("3 review rounds");
  await app.emulateMedia({ colorScheme: "dark" });
  const roundsBackground = await app.locator("#convergenceRounds").evaluate((el) => getComputedStyle(el).backgroundColor);
  const pickerBackground = await app.locator("#agentsSearch").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(roundsBackground).toBe(pickerBackground);
  await app.locator('[data-discussion-mode="parallel"]').click();
  const request = app.waitForRequest((r) => new URL(r.url()).pathname === "/api/message" && r.method() === "POST");
  await app.locator("#input").fill("@all Compare these options.");
  await app.locator("#sendBtn").click();
  expect(JSON.parse((await request).postData()).discussionMode).toBe("parallel");
});

test.describe("strict convergence handoff", () => {
  test.use({ discussionMode: null, serverEnv: { FAKE_CONVERGENCE: "approve", FAKE_CONVERGENCE_REVIEW_DELAY: "1000" } });

  test("renders one agreed handoff with inspectable positions and approvals", async ({ app, server }) => {
    await createRoom(app, server, "agreed-handoff");
    await app.locator('.chip[data-t="both"]').click();
    await send(app, "@all Choose one recommendation and explain the tradeoff.");
    await idle(server, "agreed-handoff");
    await expect(app.locator("#convergencePanel .convergence-status")).toHaveText("agreed");
    await expect(app.locator("#convergencePanel")).toContainText("5/8 agent calls");
    await expect(app.locator(".convergence-contributions")).toBeVisible();
    await app.locator(".convergence-contributions summary").click();
    await expect(app.locator(".convergence-contributions article")).toHaveCount(4);
    await expect(app.locator("#convergencePanel .convergence-final")).toContainText("Final handoff posted");
    await expect(app.locator('.sysmsg').filter({ hasText: /Synthesis from/ })).toHaveCount(1);
  });

  test("stop preserves the run and exposes resume and extend actions", async ({ app, server }) => {
    await createRoom(app, server, "stoppable");
    await app.locator('.chip[data-t="both"]').click();
    await send(app, "@all Work through this slowly.");
    await expect(app.locator('[data-convergence-action="stop"]')).toBeVisible();
    await app.locator('[data-convergence-action="stop"]').click();
    await expect.poll(async () => (await server.room("stoppable")).room.convergence?.phase).toBe("stopped");
    await expect(app.locator('[data-convergence-action="resume"]')).toBeVisible();
    await expect(app.locator('[data-convergence-action="extend"]')).toBeVisible();
  });
});
