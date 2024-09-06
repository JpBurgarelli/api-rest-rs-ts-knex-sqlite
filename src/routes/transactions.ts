import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id";

export async function transactionsRoutes(app: FastifyInstance) {
  /*
  app.addHook("preHandler", (request) => {
    console.log(`[${request.method}] ${request.url} tentando aqui`);
  });
*/
  app.post("/", async (request, reply) => {
    let sessionId = request.cookies.sessionId;
    console.log("Entrou na rota, pelo menos");

    if (!sessionId) {
      sessionId = randomUUID();
      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, //7dias
      });
    }
    // Criando a validacao para os dados que  virao
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    // Verifica se os dados que estao vindo de request.body sao igual ao schema definido createTransactionBodySchema
    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    );

    // faz a insencao na tabela chamada transactions
    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });

  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;
      console.log("entrou dentro da primeira rota get");
      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();

      return {
        transactions: transactions,
      };
    },
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const schemaIdValidation = z.object({
        id: z.string().uuid(),
      });

      const { sessionId } = request.cookies;
      const { id } = schemaIdValidation.parse(request.params);

      const transaction = await knex("transactions")
        .where({
          id,
          session_id: sessionId,
        })
        .first();

      return {
        transaction,
      };
    },
  );

  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amount", { as: "amount" })
        .first();

      return {
        summary,
      };
    },
  );
}
