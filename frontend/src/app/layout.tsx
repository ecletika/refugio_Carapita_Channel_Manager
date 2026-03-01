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
            <body>
                <SplashLoader />
                {children}
            </body>
        </html>
    );
}
