import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "./providers/SessionProvider";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
export const metadata = {
    title: "Proovd - Social Proof Notifications",
    description: "Add social proof notifications to your website to build trust and boost conversions",
};
export default function RootLayout({ children, }) {
    return (<html lang="en" data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>);
}
