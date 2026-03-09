import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { AdvancesClient } from "./advances-client";

export const metadata = { title: "Avanços — Avizz Hub" };

export default async function AdvancesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const userId = session.user.id;

  // SDR e operational não registram avanços
  if (role === "sdr" || role === "operational") redirect("/dashboard");

  return <AdvancesClient role={role} userId={userId} />;
}
