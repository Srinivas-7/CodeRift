import "@/styles/globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatedWorldBackground } from "@/components/layout/AnimatedWorldBackground";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono, Pixelify_Sans, Unbounded, Syne } from "next/font/google";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display-src",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne-src",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif-src",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans-src",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk-src",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-mono-src",
  display: "swap",
});

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeRift — 191 Problems. 3 Every Day. Beat Your Friends.",
  description:
    "A gamified DSA consistency platform built exclusively on Striver's SDE Sheet. Transform the 191-problem mountain into a daily 3-problem mission with private friend leaderboards, streaks, and seasons.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('coderift-theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = prefersDark ? 'dark' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch (e) {}
  })();
`;

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
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${pixelifySans.variable} ${unbounded.variable} ${syne.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AnimatedWorldBackground />
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
