import fastify from "fastify";
import cookie from "@fastify/cookie";
import { transactionsRoutes } from "./routes/transactions";
import { knex } from "./database";
import { randomUUID } from "crypto";

export const app = fastify();

app.register(cookie);

app.register(transactionsRoutes, {
  prefix: "transactions",
});



/*
app.get('/hello2', async () => {
  const transaction = await knex("transactions").insert({
    id: randomUUID(),
    title: "titutlo",
    amount: 2222,
  }).returning('*')


  return transaction

})

*/
