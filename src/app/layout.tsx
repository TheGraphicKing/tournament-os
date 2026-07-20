import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Tournament OS", template: "%s · Tournament OS" },
  description:
    "Run tournaments end to end — registrations, payments, comms, match day.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tournament OS" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#F16C1D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
