import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import CustomerOrderSoundMonitor from "./components/CustomerOrderSoundMonitor";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://qtoo.in"),
  title: {
    default: "Qtoo | Good food. Less wait.",
    template: "%s | Qtoo",
  },
  applicationName: "Qtoo",
  manifest: "/manifest.webmanifest?v=3",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
  },
  appleWebApp: {
    title: "Qtoo",
    capable: true,
    statusBarStyle: "default",
  },
  description: "Discover local food outlets, browse menus, and order ahead for self receive or dine in with Qtoo.",
  openGraph: {
    type: "website",
    siteName: "Qtoo",
    title: "Qtoo | Good food. Less wait.",
    description: "Discover local food outlets, browse menus, and order ahead for pickup or dine in.",
    url: "https://qtoo.in",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f3222b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
  <CartProvider>
    <CustomerOrderSoundMonitor />
    {children}
  </CartProvider>
</body>
    </html>
  );
}
