import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SDE_SHEET_PROBLEMS } from "@/data/sdeSheetProblems";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/AdminClient";
import { ShieldAlert, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    // If not admin, redirect to dashboard
    redirect("/dashboard");
  }

  const totalUsers = await db.user.count();
  const totalGroups = await db.group.count();
  const totalSubmissions = await db.submission.count();

  return (
    <div className="app-container" style={{ padding: "2.5rem 1.25rem 4rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            color: "var(--neon-amber)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.4rem",
          }}
        >
          <ShieldAlert size={14} /> RESTRICTED SYSTEM CONTROL
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)" }}>
          ARENA <span className="text-gradient-gold">ADMINISTRATION</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
          Monitor the 191 SDE Sheet problem dataset, active warriors, and squad integrity.
        </p>
      </div>

      <AdminClient
        problems={SDE_SHEET_PROBLEMS}
        totalUsers={totalUsers}
        totalGroups={totalGroups}
        totalSubmissions={totalSubmissions}
      />
    </div>
  );
}
