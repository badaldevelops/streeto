import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = process.argv[2] ?? "customer";
const appTypes = new Set(["customer", "business", "admin"]);
if (!appTypes.has(app)) throw new Error(`Unknown Qtoo app: ${app}`);

const source = path.join(root, "src", "app");
const appDir = path.join(root, ".qtoo-app-build", app, "app");
const safeBase = path.join(root, ".qtoo-app-build", app);
if (!appDir.startsWith(`${safeBase}${path.sep}`)) throw new Error("Generated app path escaped its build folder.");
await rm(appDir, { recursive: true, force: true });
await mkdir(appDir, { recursive: true });

async function copy(relativePath, renameTo = relativePath) {
  await cp(path.join(source, relativePath), path.join(appDir, renameTo), { recursive: true });
}

await copy("components");
await copy("globals.css");
if (app === "customer") {
  await copy("layout.tsx");
  await copy("api");
  for (const route of ["page.tsx", "error.tsx", "business", "checkout", "delivery", "forgot-password", "login", "my-orders", "profile", "register", "reset-password", "privacy", "refunds", "terms"]) {
    try { await copy(route); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
} else {
  const displayName = app === "business" ? "Qtoo Business" : "Qtoo Admin";
  const themeColor = app === "business" ? "#174b3a" : "#3b317c";
  const icon = app === "business" ? "/icon-business.png" : "/icon-admin.svg";
  const iconType = app === "business" ? "image/png" : "image/svg+xml";
  const businessImports = app === "business"
    ? 'import BusinessAudioUnlock from "@/app/components/BusinessAudioUnlock";\nimport BusinessAdminOrderAlerts from "@/app/components/BusinessAdminOrderAlerts";\n'
    : "";
  const businessComponents = app === "business" ? "<BusinessAudioUnlock /><BusinessAdminOrderAlerts />" : "";
  await writeFile(path.join(appDir, "layout.tsx"), `import type { Metadata, Viewport } from "next";\nimport { Geist } from "next/font/google";\nimport "./globals.css";\n${businessImports}const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });\nexport const metadata: Metadata = { title: "${displayName}", applicationName: "${displayName}", manifest: "/manifest.webmanifest", icons: { icon: [{ url: "${icon}", type: "${iconType}" }], apple: [{ url: "${icon}", type: "${iconType}" }] }, appleWebApp: { title: "${displayName}", capable: true, statusBarStyle: "default" }, description: "${app === "business" ? "Manage your Qtoo business and outlets." : "Manage the Qtoo marketplace."}" };\nexport const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "${themeColor}" };\nexport default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="en" className={\`${"${geist.variable}"} h-full antialiased\`}><body className="min-h-full">${businessComponents}{children}</body></html>; }\n`);
  const rootPage = app === "business" ? 'import { redirect } from "next/navigation"; export default function Home() { redirect("/business-login"); }\n' : 'import { redirect } from "next/navigation"; export default function Home() { redirect("/login"); }\n';
  await writeFile(path.join(appDir, "page.tsx"), rootPage);
  const routeSet = app === "business"
    ? ["business-login", "login", "business-register", "business-admin", "forgot-password", "reset-password"]
    : ["login", "admin", "forgot-password", "reset-password"];
  for (const route of routeSet) await copy(route);
  const routeLayout = app === "business" ? "business-admin/layout.tsx" : "admin/layout.tsx";
  const routeLayoutContent = "export default function AppRoleLayout({ children }: { children: React.ReactNode }) { return children; }\n";
  await writeFile(path.join(appDir, routeLayout), routeLayoutContent);
  const proxyDir = path.join(appDir, "api", "[[...path]]");
  await mkdir(proxyDir, { recursive: true });
  await writeFile(path.join(proxyDir, "route.ts"), `const API_ORIGIN = "https://qtoo.in";\nasync function proxy(request: Request) { const incoming = new URL(request.url); const target = new URL(incoming.pathname + incoming.search, API_ORIGIN); const headers = new Headers(request.headers); headers.delete("host"); headers.delete("content-length"); const upstream = await fetch(new Request(target, { method: request.method, headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body, redirect: "manual" })); return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: upstream.headers }); }\nexport const GET = proxy; export const POST = proxy; export const PUT = proxy; export const PATCH = proxy; export const DELETE = proxy;\n`);
}

const manifest = app === "customer"
  ? `import type { MetadataRoute } from "next"; export default function manifest(): MetadataRoute.Manifest { return { name: "Qtoo", short_name: "Qtoo", description: "Order from local Qtoo businesses.", start_url: "/", scope: "/", display: "standalone", background_color: "#fffaf5", theme_color: "#f3222b", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon.png", sizes: "512x512", type: "image/png" }] }; }\n`
  : `import type { MetadataRoute } from "next"; export default function manifest(): MetadataRoute.Manifest { return { name: "Qtoo ${app === "business" ? "Business" : "Admin"}", short_name: "Qtoo ${app === "business" ? "Business" : "Admin"}", description: "${app === "business" ? "Manage your Qtoo business." : "Manage the Qtoo marketplace."}", start_url: "${app === "business" ? "/business-admin" : "/admin"}", scope: "/", display: "standalone", background_color: "#ffffff", theme_color: "${app === "business" ? "#174b3a" : "#3b317c"}", icons: [{ src: "${app === "business" ? "/icon-business.png" : "/icon-admin.svg"}", sizes: "${app === "business" ? "512x512" : "any"}", type: "${app === "business" ? "image/png" : "image/svg+xml"}", purpose: "any" }] }; }\n`;
await writeFile(path.join(appDir, "manifest.ts"), manifest);
console.log(`Prepared ${app} app at ${path.relative(root, appDir)}.`);
