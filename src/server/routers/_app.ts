import { createTRPCRouter } from "@/server/trpc";
import { dashboardRouter } from "@/server/routers/dashboard";
import { reportsRouter } from "@/server/routers/reports";
import { productsRouter } from "@/server/routers/products";
import { gatewaysRouter } from "@/server/routers/gateways";
import { salesRouter } from "@/server/routers/sales";
import { advancesRouter } from "@/server/routers/advances";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  reports: reportsRouter,
  products: productsRouter,
  gateways: gatewaysRouter,
  sales: salesRouter,
  advances: advancesRouter,
});

export type AppRouter = typeof appRouter;
