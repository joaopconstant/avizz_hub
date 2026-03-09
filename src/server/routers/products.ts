import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const productsRouter = createTRPCRouter({
  /**
   * Lista produtos ativos da empresa, ordenados por sort_order.
   * Usado para popular dropdowns de seleção de produto.
   */
  listActive: protectedProcedure.query(async ({ ctx }) => {
    const { session, db } = ctx;

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { company_id: true },
    });

    return db.product.findMany({
      where: { company_id: user.company_id, is_active: true },
      select: {
        id: true,
        name: true,
        counts_as_sale: true,
        is_primary: true,
        sort_order: true,
      },
      orderBy: { sort_order: "asc" },
    });
  }),
});
