import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium, devices } from "@playwright/test";

const baseURL = "http://localhost:4173";
const serverOutput = [];

function startPreview() {
  const child = spawn(
    process.execPath,
    ["./node_modules/vite/bin/vite.js", "preview", "--host", "localhost", "--port", "4173", "--strictPort"],
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    }
  );

  child.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  child.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));
  return child;
}

async function waitForServer(timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(`Preview server did not become ready.\n${serverOutput.join("")}`);
}

async function stopPreview(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 2_000))
  ]);
}

async function runCase(browser, name, contextOptions) {
  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    window.__speakCount = 0;
    window.__oscStarts = 0;
    window.__frequencies = [];
    class FakeAudioContext {
      constructor() {
        this.currentTime = 0;
        this.destination = {};
        this.state = "running";
      }

      async resume() {
        this.state = "running";
      }

      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime(value) {
              window.__frequencies.push(value);
            }
          },
          connect() {},
          start() {
            window.__oscStarts += 1;
          },
          stop() {}
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {}
          },
          connect() {}
        };
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
      this.lang = "";
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
    };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        getVoices() {
          return [{ lang: "en-US" }];
        },
        speak(utterance) {
          window.__speakCount += 1;
          utterance.onstart?.(new Event("start"));
        }
      }
    });
  });
  const page = await context.newPage();
  const errors = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /训练|Training/ }).waitFor();
  await page.getByRole("button", { name: /开始本局|Start session/ }).click();
  await page.getByText(/试次 1|Trial 1/).waitFor();
  const positionButton = page.getByRole("button", { name: /位置 匹配|Position match/ });
  await positionButton.waitFor();
  await page.waitForTimeout(250);

  const speechAfterStart = await page.evaluate(() => window.__speakCount);
  await page.keyboard.press("KeyA");
  await page.waitForTimeout(100);
  const speechAfterShortcut = await page.evaluate(() => window.__speakCount);
  const shortcutPressed = await positionButton.getAttribute("aria-pressed");

  if (shortcutPressed !== "true") {
    throw new Error(`${name}: KeyA did not mark the position response button as answered.`);
  }

  if (speechAfterStart !== 1 || speechAfterShortcut !== 1) {
    throw new Error(
      `${name}: expected one speech playback for the trial, got ${speechAfterStart} after start and ${speechAfterShortcut} after shortcut.`
    );
  }

  const modesLink = page.getByRole("link", { name: /模式|Modes/ });
  const lockedModesLink = await modesLink.getAttribute("aria-disabled");
  if (lockedModesLink !== "true" || !page.url().includes("/train")) {
    throw new Error(`${name}: active training should lock navigation on the training page.`);
  }

  await page.getByRole("button", { name: /停止|Stop/ }).click();
  await page.getByRole("link", { name: /统计|Stats/ }).click();
  await page.getByRole("heading", { name: /统计面板|Stats/ }).waitFor();
  await modesLink.click();
  const applyButton = page.getByRole("button", { name: /应用|Apply/ });
  const presetSelect = page.locator(".settings-grid .panel select").first();
  await applyButton.waitFor();
  const applyBox = await applyButton.boundingBox();
  const viewport = page.viewportSize();
  if (!applyBox || !viewport || applyBox.y < 0 || applyBox.y + applyBox.height > viewport.height) {
    throw new Error(`${name}: settings apply button is not visible in the initial viewport.`);
  }
  if (name === "desktop") {
    const hasPageScroll = await page.evaluate(
      () => document.documentElement.scrollHeight > document.documentElement.clientHeight + 1
    );
    if (hasPageScroll) {
      throw new Error(`${name}: settings page should fit without vertical page scroll.`);
    }
  }

  await presetSelect.selectOption("color-audio");
  await applyButton.click();
  await page.getByRole("link", { name: /训练|Train/ }).click();
  if ((await page.locator(".stimulus-grid").count()) !== 0) {
    throw new Error(`${name}: color/audio mode should not render the position grid.`);
  }
  await page.getByRole("button", { name: /开始本局|Start session/ }).click();
  await page.waitForTimeout(100);
  if ((await page.locator(".color-token").count()) === 0) {
    throw new Error(`${name}: color/audio mode did not render a color stimulus.`);
  }
  await page.getByRole("button", { name: /停止|Stop/ }).click();

  await page.getByRole("link", { name: /模式|Modes/ }).click();
  await presetSelect.selectOption("tone-dual");
  await applyButton.click();
  await page.evaluate(() => {
    window.__oscStarts = 0;
    window.__frequencies = [];
  });
  await page.getByRole("link", { name: /训练|Train/ }).click();
  await page.getByRole("button", { name: /开始本局|Start session/ }).click();
  await page.waitForTimeout(100);
  const toneState = await page.evaluate(() => ({ starts: window.__oscStarts, frequencies: window.__frequencies }));
  if (toneState.starts < 1 || toneState.frequencies.length < 1) {
    throw new Error(`${name}: tone-dual mode did not start Web Audio tone playback.`);
  }
  await page.getByRole("button", { name: /停止|Stop/ }).click();

  if (errors.length > 0) {
    throw new Error(`${name} browser errors:\n${errors.join("\n")}`);
  }

  await context.close();
  console.log(`${name}: ok`);
}

const server = startPreview();

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  await runCase(browser, "desktop", { viewport: { width: 1366, height: 700 } });
  await runCase(browser, "mobile", devices["Pixel 7"]);
  await browser.close();
} finally {
  await stopPreview(server);
}
