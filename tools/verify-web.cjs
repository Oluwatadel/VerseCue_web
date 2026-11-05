const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  const base = process.env.VERSECUE_TEST_URL || "http://127.0.0.1:3087";
  const output = path.resolve("artifacts/web-review"); fs.mkdirSync(output, { recursive: true });
  const routes = ["/", "/features", "/download", "/docs", "/support", "/about", "/releases", "/account/login", "/account/register"];
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: "reduce" });
      const errors = []; page.on("pageerror", (error) => errors.push(error.message));
      // No public page should send a signup or payment request.
      page.on("request", (request) => { if (request.method() === "POST") errors.push("Unexpected POST: " + request.url()); });
      for (const route of routes) {
        const response = await page.goto(base + route, { waitUntil: "networkidle" }); assert.equal(response.status(), 200, route);
        assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1, route + " has one page title");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow on ${route} at ${width}`);
        const text = await page.locator("body").innerText();
        assert.doesNotMatch(text, /join.*waitlist|bank transfer|account number|donate|checkout|subscribe now|₦7,500|\$15\/month/i, route + " has no waitlist/payment campaign");
        for (const image of await page.getByAltText("VerseCue", { exact: true }).all()) {
          const src = await image.getAttribute("src"); assert.ok(src.includes("versecue-logo.png"), "Shared branding uses the uploaded logo");
        }
        if (route !== "/") await page.screenshot({ path: path.join(output, `${route.slice(1)}-${width}.png`), fullPage: true });
      }
      await page.goto(base, { waitUntil: "networkidle" });
      await page.keyboard.press("Tab"); assert.equal(await page.getByRole("link", { name: "Skip to content" }).evaluate((el) => el === document.activeElement), true);
      assert.equal(await page.locator("#features article").count(), 6);
      await page.locator("#workspace").getByRole("button", { name: "Live dashboard", exact: true }).waitFor();
      assert.equal(await page.locator("#workspace").getByRole("button", { name: "Live dashboard", exact: true }).getAttribute("aria-pressed"), "true");
      if (width < 1024) { await page.getByRole("button", { name: "Open menu" }).click(); await page.locator("#mobile-menu").getByRole("link", { name: "Support", exact: true }).click(); assert.ok(page.url().endsWith("/support")); await page.goto(base); }
      await page.getByRole("button", { name: /Psalm 19:1 Sample detection/ }).click();
      await page.getByText("Psalm 19:1 (KJV)", { exact: true }).waitFor();
      await page.getByText("Demo output · Nothing displayed", { exact: true }).waitFor();
      await page.getByRole("button", { name: "+ Queue", exact: true }).click();
      await page.getByRole("button", { name: /Psalm 19:1 Sample detection/ }).dblclick();
      await page.getByText("Demo output · Psalm 19:1", { exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: /Psalm 19:1 Sample detection/ }).count(), 0);
      await page.getByText("Bookmarked: Psalm 19:1", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Reset walkthrough" }).click();
      for (const label of ["Live dashboard", "Theme preview", "Verse backgrounds", "Motion screensavers", "Speech models"]) {
        await page.locator("#workspace").getByRole("button", { name: label, exact: true }).click();
        const shot = page.locator("#workspace img"); await shot.scrollIntoViewIfNeeded(); await shot.evaluate((img) => img.decode());
        assert.ok(await shot.evaluate((img) => img.naturalWidth > 0), label + " loads");
      }
      await page.locator("#workspace").getByRole("button", { name: "Live dashboard", exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(output, `homepage-${width}.png`), fullPage: true });
      await page.goto(base + "/download");
      await page.getByRole("link", { name: "Create free account", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "macOS coming soon", exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Linux coming soon", exact: true }).isDisabled(), true);
      await page.goto(base + "/features"); assert.equal(await page.locator("#features article").count(), 12);
      await page.goto(base + "/docs");
      const guides = await page.locator('main a[href^="/docs/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      assert.equal(guides.length, 6);
      for (const guide of guides) { const response = await page.goto(base + guide); assert.equal(response.status(), 200); assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
      await page.goto(base + "/support");
      assert.equal(await page.locator("#faq details").count(), 10);
      await page.getByLabel("What happened?", { exact: true }).fill("Example issue from a local browser test");
      await page.getByLabel("Steps to reproduce", { exact: true }).fill("Open Preferences and select a theme.");
      await page.getByRole("button", { name: "Create report", exact: true }).click();
      const report = await page.getByLabel("Your prepared report", { exact: true }).inputValue();
      assert.match(report, /Example issue from a local browser test/); assert.match(report, /VerseCue Clarity/);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: path.join(output, `support-report-${width}.png`), fullPage: true });
      const legacy = await page.goto(base + "/waitlist"); assert.equal(legacy.status(), 200); assert.ok(page.url().endsWith("/download"));
      const missing = await page.goto(base + "/docs/missing-guide"); assert.equal(missing.status(), 404);
      assert.deepEqual(errors, [], "No browser JavaScript errors or unexpected submissions");
      console.log(`PASS: ${width}px all public pages, six guides, branding, dashboard gallery, download placeholders, demo and local support report`);
      await page.close();
    }
    const page = await browser.newPage();
    await page.goto(base + "/account/register");
    await page.getByRole("heading", {name:"Create your account."}).waitFor();
    assert.equal(await page.getByLabel("Activation code",{exact:true}).count(),0);
    assert.equal(await page.getByLabel("Organisation name",{exact:true}).count(),1);
    await page.goto(base + "/download");
    assert.match(await page.locator("main").innerText(),/email and organisation name/);
    const icon = await page.request.get(base + "/icon.png"); assert.equal(icon.status(), 200);
    const canonical = fs.readFileSync("public/versecue-logo.png"); assert.deepEqual(await icon.body(), canonical);
    assert.equal((await page.request.get(base + "/favicon.ico")).status(), 200);
    const share = await page.request.get(base + "/opengraph-image.png"); assert.deepEqual(await share.body(), canonical);
    const sitemap = await page.request.get(base + "/sitemap.xml"); assert.equal(sitemap.status(), 200); assert.match(await sitemap.text(), /docs\/appearance-previews/);
    assert.equal((await page.request.get(base + "/api/admin/waitlist")).status(), 401);
    assert.equal((await page.request.get(base + "/api/admin/licenses")).status(), 401);
    assert.equal((await page.request.get(base + "/api/account")).status(), 401); // no database configured in this local check
    await page.goto(base + "/about");
    await page.getByRole("heading", {name:"Made for the pulpit and the media desk."}).waitFor();
    assert.match(await page.locator("main").innerText(),/preachers and church media teams/);
    await page.goto(base + "/account/login");
    assert.equal(await page.getByLabel("Email",{exact:true}).count(),1);
    assert.equal(await page.getByLabel("Password",{exact:true}).count(),1);
    console.log("PASS: uploaded logo in browser/share assets, sitemap, and protected legacy administration");
    await page.close();
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
