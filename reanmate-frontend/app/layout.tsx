import type { Metadata, Viewport } from "next";
import { Kantumruy_Pro } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-khmer",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#063e3d",
};

export const metadata: Metadata = {
  title: "ReanMate — មិត្ត AI សម្រាប់សិស្សថ្នាក់ទី១០ ដល់ទី១២",
  description:
    "រៀនគណិតវិទ្យា និងប្រវត្តិវិទ្យា តាមកម្មវិធីសិក្សារបស់ក្រសួងអប់រំ។ មើលវីដេអូ MoEYS សួរ AI ជាភាសាខ្មែរ រួចធ្វើតេស្ត។",
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="km" className={kantumruy.variable}>
      <body className={`${kantumruy.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
