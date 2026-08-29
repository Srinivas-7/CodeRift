import "@/styles/globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DSA ARENA — 191 Problems. 3 Every Day. Beat Your Friends.",
  description:
    "A gamified DSA consistency platform built exclusively on Striver's SDE Sheet. Transform the 191-problem mountain into a daily 3-problem mission with private friend leaderboards, streaks, and seasons.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  let unreadCount = 0;
  if (user) {
    unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });
  }

  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Navbar
          user={
            user
              ? {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  avatar: user.avatar,
                  xp: user.xp,
                  level: user.level,
                  currentStreak: user.currentStreak,
                  streakShields: user.streakShields,
                  role: user.role,
                }
              : null
          }
          unreadCount={unreadCount}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
