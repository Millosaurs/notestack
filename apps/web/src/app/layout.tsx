import type { Metadata } from "next";

import { Space_Grotesk, Geist_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const space = Space_Grotesk({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "notestack",
    description: "notestack",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${space.variable} ${geistMono.variable} antialiased`}
            >
                <Providers>
                    <div className="grid grid-rows-[auto_1fr] h-svh">
                        <Header />
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
