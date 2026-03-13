import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { GoalsClient } from "@/components/goals/goals-client";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "admin" && role !== "head") {
    redirect("/unauthorized");
  }

  return <GoalsClient role={role} />;
}
