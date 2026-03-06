import { createTRPCRouter } from "@/server/trpc";
import { dashboardRouter } from "@/server/routers/dashboard";
import { reportsRouter } from "@/server/routers/reports";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
