import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const gatewaysRouter = createTRPCRouter({
  /**
   * Lista gateways ativos da empresa.
   * Usado para popular dropdown de gateway no formulário de venda com cartão.
   */
  listActive: protectedProcedure.query(async ({ ctx }) => {
    const { session, db } = ctx;

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { company_id: true },
    });

    return db.gateway.findMany({
      where: { company_id: user.company_id, is_active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }),

  /**
   * Retorna a taxa do gateway para um número específico de parcelas.
   * Usado para preview do net_value no formulário (cálculo real ocorre no servidor).
   */
  getRate: protectedProcedure
    .input(
      z.object({
        gateway_id: z.string().min(1),
        installments: z.number().int().min(1).max(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rate = await ctx.db.gatewayRate.findUnique({
        where: {
          gateway_id_installments: {
            gateway_id: input.gateway_id,
            installments: input.installments,
          },
        },
        select: { rate_percent: true },
      });

      if (!rate) return null;

      return { rate_percent: Number(rate.rate_percent) };
    }),
});
