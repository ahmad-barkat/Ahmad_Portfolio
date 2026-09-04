/**
 * Extracts 4K frames from "laptop opening scene.mp4"
 * Uses @ffmpeg-installer/ffmpeg (bundled ffmpeg binary)
 * Run: node scripts/extract-4k-frames.mjs
 */

import { createRequire } from "module";
import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

// Try to find ffmpeg — winget, PATH, or bundled
function findFfmpeg() {
  // 1. Try PATH first (winget may have installed it)
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return "ffmpeg";
  } catch {}

  // 2. Try winget default install location
  const wingetPaths = [
    "C:\\Program Files\\FFmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files (x86)\\FFmpeg\\bin\\ffmpeg.exe",
    join(process.env.LOCALAPPDATA || "", "Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe"),
    join(process.env.USERPROFILE || "", "scoop\\apps\\ffmpeg\\current\\bin\\ffmpeg.exe"),
  ];

  for (const p of wingetPaths) {
    if (existsSync(p)) {
      console.log("Found ffmpeg at:", p);
      return p;
    }
  }

  // 3. Try bundled @ffmpeg-installer
  try {
    const require = createRequire(import.meta.url);
    const installer = require("@ffmpeg-installer/ffmpeg");
    if (existsSync(installer.path)) return installer.path;
  } catch {}

  return null;
}

const ffmpegPath = findFfmpeg();

if (!ffmpegPath) {
  console.error("❌ ffmpeg not found. Please run: winget install Gyan.FFmpeg");
  console.error("   Then open a NEW terminal and run this script again.");
  process.exit(1);
}

const videoPath   = join(ROOT, "laptop opening scene.mp4");
const outputDir   = join(ROOT, "public", "laptop");
const outputGlob  = join(outputDir, "ezgif-frame-%03d.jpg");

if (!existsSync(videoPath)) {
  console.error("❌ Video not found at:", videoPath);
  process.exit(1);
}

// Create output dir
mkdirSync(outputDir, { recursive: true });

console.log("🎬 Starting 4K frame extraction...");
console.log("   Input :", videoPath);
console.log("   Output:", outputDir);
console.log("   Scale : 3840×2160 (4K UHD)");
console.log("");

// ffmpeg args — 4K, highest quality JPEG, 30fps
const args = [
  "-i",       videoPath,
  "-vf",      "scale=3840:2160:flags=lanczos",  // Lanczos = sharpest upscale
  "-q:v",     "1",       // JPEG quality 1 = best (scale 1-31)
  "-r",       "30",      // 30 fps
  "-y",                  // overwrite
  outputGlob,
];

const proc = spawn(`"${ffmpegPath}"`, args, {
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});

let lastLine = "";
proc.stderr.on("data", (data) => {
  const text = data.toString();
  // Show progress lines only
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.includes("frame=") || line.includes("fps=") || line.includes("time=")) {
      process.stdout.write("\r" + line.trim().substring(0, 80));
      lastLine = line;
    }
  }
});

proc.on("close", (code) => {
  console.log("\n");
  if (code === 0) {
    const count = readdirSync(outputDir).filter(f => f.endsWith(".jpg")).length;
    console.log(`✅ Done! Extracted ${count} frames at 4K UHD to public/laptop/`);
    console.log("   Each frame: 3840×2160 @ highest JPEG quality");
    console.log("   Refresh your browser — frames will now render in full 4K.");
  } else {
    console.error("❌ ffmpeg exited with code:", code);
  }
});

proc.on("error", (err) => {
  console.error("❌ Error:", err.message);
});
