#!/usr/bin/env node

const path = require("path");
const rimraf = require("rimraf");
const {
  spawn
} = require("child_process");
const fs = require("fs");
const readdir = require("fs-readdir-recursive");

const LICENSE = fs.readFileSync(path.join(__dirname, "..", "LICENSE"), "utf8")
  .split("\n")
  .map((row, line) => {
    if (row !== "") row = ` ${row}`;

    if (line === 0) return `/*\n *${row}`;

    return ` *${row}`
  })
  .join("\n") +
  "/\n";

const startTime = new Date().getTime();

const outDir = path.join(__dirname, "..", "dist");

rimraf.sync(outDir);

const tsc = spawn(path.join(__dirname, "..", "node_modules", ".bin", "tsc"));

tsc.stdout.on("data", (data) => console.log(`stdout: ${data}`));

tsc.stderr.on("data", (data) => console.log(`stderr: ${data}`));

tsc.on('close', (code) => {
  const fileNames = readdir(outDir, (filename) => /(?<!\.ts)$/.test(filename));

  fileNames.map((filename) => {
    const filePath = path.join(outDir, filename);

    const content = fs.readFileSync(filePath, "utf8");

    if (content.error) throw content.error;

    fs.writeFileSync(filePath, `${LICENSE}\n${content}`, "utf8");
  });

  const defenitionFiles = readdir(outDir, (filename) => /(?<!\.js)$/.test(filename));

  defenitionFiles.map((filename) => {
    const filePath = path.join(outDir, filename);

    const content = fs.readFileSync(filePath, "utf8");

    fs.writeFileSync(filePath, `${LICENSE}\n${content}`, "utf8");
  });

  if (code === 0) console.log(`finished in ${new Date().getTime() - startTime}ms`);
  else console.error(`child process exited with code ${code}`);
});