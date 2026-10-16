import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = process.argv[2] ?? "customer";
const allowed = new Set(["customer", "business", "admin"]);
if (!allowed.has(app)) throw new Error(`Unknown Qtoo app: ${app}`);

const prepare = spawn(process.execPath, [path.join(root, "scripts", "prepare-app.mjs"), app], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
const prepareCode = await new Promise((resolve, reject) => {
  prepare.once("error", reject);
  prepare.once("exit", resolve);
});
if (prepareCode !== 0) process.exit(prepareCode ?? 1);

const child = spawn(process.execPath, [path.join(root, "node_modules", "vite", "bin", "vite.js"), "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, QTOO_APP: app },
});
child.once("error", (error) => { console.error(error); process.exitCode = 1; });
child.once("exit", (code) => { process.exitCode = code ?? 1; });
