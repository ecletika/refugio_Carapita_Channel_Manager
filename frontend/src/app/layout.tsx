import type { Metadata } from "next";
import "./globals.css";
import SplashLoader from "../components/SplashLoader";

export const metadata: Metadata = {
    title: "Refúgio Carapita - Alojamento Local",
    description: "Reserve agora no Refúgio Carapita em Ourém, PT.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-PT">
            <head>
                {/* Favicon — funciona em todos os browsers modernos */}
                <link rel="icon"             type="image/jpeg" href="/logo.jpg" />
                <link rel="shortcut icon"    type="image/jpeg" href="/logo.jpg" />
                <link rel="apple-touch-icon"                   href="/logo.jpg" />
            </head>
            <body>
                <SplashLoader />
                {children}
            </body>
        </html>
    );
}
