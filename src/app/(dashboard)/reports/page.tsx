import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { ReportsClient } from "./reports-client";

export const metadata = { title: "Relatórios — Avizz Hub" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const userId = session.user.id;

  // operational não tem acesso a relatórios
  if (role === "operational") redirect("/dashboard");

  return <ReportsClient role={role} userId={userId} />;
}
