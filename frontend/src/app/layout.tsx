import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/lib/Web3Provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowStake | Yield-Preserving LST Swap",
  description: "Uniswap v4 Hook for LST Yield Capture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        <Web3Provider>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </Web3Provider>
      </body>
    </html>
  );
}
