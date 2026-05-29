import type { Metadata } from "next";
import "./globals.css";
import SplashLoader from "../components/SplashLoader";

export const metadata: Metadata = {
    title: "Refúgio Carapita - Alojamento Local",
    description: "Uma casa com alma, no coração de Portugal. Alojamento local em Ourém.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-PT">
            <head>
                {/* ── Favicon ─────────────────────────────────────────── */}
                <link rel="icon"             type="image/jpeg" href="/logo.jpg" sizes="any" />
                <link rel="shortcut icon"    type="image/jpeg" href="/logo.jpg" />
                <link rel="apple-touch-icon"                   href="/logo.jpg" />

                {/* ── Web App Manifest (Google Search icon + PWA) ──── */}
                <link rel="manifest" href="/site.webmanifest" />

                {/* ── Theme colour (barra do browser no Android) ────── */}
                <meta name="theme-color" content="#1E3932" />
                <meta name="msapplication-TileColor" content="#1E3932" />
                <meta name="msapplication-TileImage" content="/logo.jpg" />
            </head>
            <body>
                <SplashLoader />
                {children}
            </body>
        </html>
    );
}
