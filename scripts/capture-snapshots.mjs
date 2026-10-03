import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const snapshotsDir = path.join(rootDir, "snapshots");

if (!fs.existsSync(snapshotsDir)) {
  fs.mkdirSync(snapshotsDir, { recursive: true });
}

// Find Edge or Chrome executable
const possiblePaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

const executablePath = possiblePaths.find((p) => fs.existsSync(p));

if (!executablePath) {
  console.error("❌ No browser executable found!");
  process.exit(1);
}

console.log(`🚀 Using browser: ${executablePath}`);

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
    ],
  });

  const routes = [
    { name: "01_landing_page", url: "http://localhost:3000/" },
    { name: "02_daily_dashboard", url: "http://localhost:3000/dashboard" },
    { name: "03_sde_roadmap", url: "http://localhost:3000/problems" },
    { name: "04_squads_hub", url: "http://localhost:3000/groups" },
    { name: "05_leaderboard", url: "http://localhost:3000/leaderboard" },
    { name: "06_warrior_profile", url: "http://localhost:3000/profile" },
    { name: "07_achievement_room", url: "http://localhost:3000/achievements" },
  ];

  // 1. Desktop Snapshots (1920x1080 High-Res)
  console.log("\n📸 Capturing Desktop Snapshots (1920x1080)...");
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  // Authenticate session via dev-token
  await desktopPage.goto("http://localhost:3000/api/dev-token", { waitUntil: "networkidle2" });

  for (const r of routes) {
    try {
      console.log(`Capturing Desktop: ${r.name}...`);
      await desktopPage.goto(r.url, { waitUntil: "networkidle2", timeout: 15000 });
      await desktopPage.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const outPath = path.join(snapshotsDir, `${r.name}_desktop.png`);
      await desktopPage.screenshot({
        path: outPath,
        fullPage: false,
      });
      console.log(`✅ Saved: snapshots/${r.name}_desktop.png`);
    } catch (e) {
      console.error(`❌ Failed ${r.name}:`, e.message);
    }
  }
  await desktopPage.close();

  // 2. Mobile Snapshots (390x844 iPhone Viewport @ 3x)
  console.log("\n📱 Capturing Mobile Snapshots (390x844 @3x)...");
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  await mobilePage.goto("http://localhost:3000/api/dev-token", { waitUntil: "networkidle2" });

  for (const r of routes) {
    try {
      console.log(`Capturing Mobile: ${r.name}...`);
      await mobilePage.goto(r.url, { waitUntil: "networkidle2", timeout: 15000 });
      await mobilePage.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const outPath = path.join(snapshotsDir, `${r.name}_mobile.png`);
      await mobilePage.screenshot({
        path: outPath,
        fullPage: false,
      });
      console.log(`✅ Saved: snapshots/${r.name}_mobile.png`);
    } catch (e) {
      console.error(`❌ Failed mobile ${r.name}:`, e.message);
    }
  }
  await mobilePage.close();

  await browser.close();
  console.log(`\n🎉 All snapshots saved to ${snapshotsDir}!\n`);
}

main().catch(console.error);
