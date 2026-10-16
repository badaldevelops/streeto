import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = process.argv[2] ?? "customer";
const configs = { customer: "cloudflare.config.ts", business: "cloudflare.business.config.ts", admin: "cloudflare.admin.config.ts" };
if (!configs[app]) throw new Error(`Unknown Qtoo app: ${app}`);
for (const args of [
  [path.join(root, "scripts", "build-app.mjs"), app],
  [path.join(root, "node_modules", "@vinext", "cloudflare", "dist", "cli.js"), "deploy", "--skip-build", "--config", configs[app]],
]) {
  const [file, ...childArgs] = args;
  const child = spawn(process.execPath, [file, ...childArgs], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, QTOO_APP: app },
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  if (code !== 0) process.exit(code ?? 1);
}
