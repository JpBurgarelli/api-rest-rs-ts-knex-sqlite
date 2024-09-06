import {
  test,
  beforeAll,
  afterAll,
  expect,
  describe,
  beforeEach,
} from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../app";

describe("transactions", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  test("Creates new a transacion", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "New transacion",
        amount: 4000,
        type: "credit",
      })
      .expect(201);
  });

  test("Lists all transactions", async () => {
    const createTransicion = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transacion",
        amount: 4000,
        type: "credit",
      });

    const cookies = createTransicion.get("Set-Cookie");

    if (!cookies) {
      throw new Error("No cookies received");
    }

    const transactionsListResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(transactionsListResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New transacion",
        amount: 4000,
      }),
    ]);
  });

  test("Gets a especif transactions", async () => {
    const createTransicion = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transacion",
        amount: 4000,
        type: "credit",
      });

    const cookies = createTransicion.get("Set-Cookie");

    if (!cookies) {
      throw new Error("No cookies received");
    }

    const transactionsListResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = transactionsListResponse.body.transactions[0].id;

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "New transacion",
        amount: 4000,
      }),
    );
  });

  test("Gets the summary", async () => {
    const createTransicion = await request(app.server)
      .post("/transactions")
      .send({
        title: "New transacion",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransicion.get("Set-Cookie");

    if (!cookies) {
      throw new Error("No cookies received");
    }

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Debit transaction",
        amount: 2000,
        type: "debit",
      });

    const GetSummaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(GetSummaryResponse.body.summary).toEqual({
      amount: 3000,
    });
  });
});
