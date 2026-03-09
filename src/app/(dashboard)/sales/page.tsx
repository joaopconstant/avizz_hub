import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/generated/prisma/enums";
import { SalesClient } from "./sales-client";

export const metadata = { title: "Vendas — Avizz Hub" };

export default async function SalesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const userId = session.user.id;

  // SDR e operational não registram vendas
  if (role === "sdr" || role === "operational") redirect("/dashboard");

  return <SalesClient role={role} userId={userId} />;
}
