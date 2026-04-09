import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { OrderDynamo } from "../models/orderModel";

jest.mock("../models/orderModel", () => {
  const scanExec = jest.fn();
  const queryExec = jest.fn();

  const scan = jest.fn().mockReturnValue({
    exec: scanExec,
  });

  const query = jest.fn().mockImplementation(() => ({
    using: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        exec: queryExec,
      }),
    }),
  }));

  return {
    OrderDynamo: {
      scan,
      query,
      create: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      __scanExec: scanExec,
      __queryExec: queryExec,
    },
  };
});

const mockedOrderDynamo = OrderDynamo as unknown as {
  create: jest.Mock;
  get: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  __scanExec: jest.Mock;
  __queryExec: jest.Mock;
};

describe("Orders API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // PROVE GET

  it("GET /orders → dovrebbe restituire tutti gli ordini", async () => {
    mockedOrderDynamo.__scanExec.mockResolvedValue([]);

    const res = await request(app).get("/orders");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.allOrders)).toBe(true);
  });

  it("GET /orders/me → dovrebbe restituire gli ordini dell'utente", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.__queryExec.mockResolvedValue([
      { id: "order-1", typeFood: "Pizza", quantity: 2, userId: "user-1" },
    ]);

    const res = await request(app)
      .get("/orders/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it("GET /orders/me → senza token deve dare 401", async () => {
    const res = await request(app).get("/orders/me");
    expect(res.statusCode).toBe(401);
  });

  // PROVE POST

  it("POST /orders → dovrebbe creare l'ordine", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.create.mockResolvedValue({});

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        typeFood: "Pizza",
        quantity: 2,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      message: "Nuovo ordine creato correttamente",
    });

    expect(mockedOrderDynamo.create).toHaveBeenCalled();
  });

  it("POST /orders → senza token deve dare 401", async () => {
    const res = await request(app).post("/orders").send({
      typeFood: "Pizza",
      quantity: 2,
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: "Nessun token fornito",
    });
  });

  // PROVE PATCH

  it("PATCH /orders/:id → dovrebbe modificare l'ordine", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue({
      id: "123",
      typeFood: "Pasta",
      quantity: 1,
      userId: "user-1",
    });
    mockedOrderDynamo.update.mockResolvedValue({});

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({
        typeFood: "Pizza",
        quantity: 3,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: "Ordine modificato correttamente",
    });

    expect(mockedOrderDynamo.update).toHaveBeenCalledWith("123", {
      typeFood: "Pizza",
      quantity: 3,
    });
  });

  it("PATCH /orders/:id → senza token deve dare 401", async () => {
    const res = await request(app)
      .patch("/orders/123")
      .send({ typeFood: "Pizza", quantity: 3 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: "Nessun token fornito",
    });
  });

  it("PATCH /orders/:id → 404 se ordine non esiste", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue(undefined);

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({ typeFood: "Pizza", quantity: 3 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: "Nessun ordine presente con l'id: 123",
    });
  });

  it("PATCH /orders/:id → 403 se ordine di altro utente", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue({
      id: "123",
      typeFood: "Pasta",
      quantity: 1,
      userId: "user-2",
    });

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({ typeFood: "Pizza" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Non autorizzato",
    });
  });

  it("PATCH /orders/:id → 403 se utente diverso", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue({
      id: "123",
      typeFood: "Pasta",
      quantity: 1,
      userId: "user-2",
    });

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({ typeFood: "Pizza" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Non autorizzato",
    });
  });

  it("PATCH /orders/:id → 500 se errore server", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({ typeFood: "Pizza" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Errore server",
    });
  });

  // PROVE DELETE

  it("DELETE /orders/:id → dovrebbe eliminare l'ordine", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue({
      id: "123",
      typeFood: "Pizza",
      quantity: 2,
      userId: "user-1",
    });
    mockedOrderDynamo.delete.mockResolvedValue({});

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: "Ordine con id 123 eliminato correttamente",
    });
    expect(mockedOrderDynamo.delete).toHaveBeenCalledWith("123");
  });

  it("DELETE /orders/:id → senza token deve dare 401", async () => {
    const res = await request(app).delete("/orders/123");

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: "Nessun token fornito",
    });
  });

  it("DELETE /orders/:id → 404 se ordine non esiste", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: "Ordine non trovato",
    });
  });

  it("DELETE /orders/:id → 403 se utente diverso", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue({
      id: "123",
      typeFood: "Pizza",
      quantity: 2,
      userId: "user-2",
    });

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Non puoi eliminare questo ordine",
    });
  });

  it("DELETE /orders/:id → 403 se ordine di altro utente", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockResolvedValue({
      id: "123",
      typeFood: "Pizza",
      quantity: 2,
      userId: "user-2",
    });

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Non puoi eliminare questo ordine",
    });
  });

  it("DELETE /orders/:id → 500 se errore server", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrderDynamo.get.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Errore server",
    });
  });

  // PROVE MOST POPULAR ORDER

  describe("GET /orders/most_order", () => {
    it("dovrebbe restituire il piatto più ordinato", async () => {
      mockedOrderDynamo.__scanExec.mockResolvedValue([
        { typeFood: "Pizza" },
        { typeFood: "Pizza" },
        { typeFood: "Pasta" },
      ]);

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ mostPopular: "Pizza", count: 2 });
    });

    it("404 se nessun ordine presente", async () => {
      mockedOrderDynamo.__scanExec.mockResolvedValue([]);

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Nessun ordine trovato" });
    });

    it("500 se errore server", async () => {
      mockedOrderDynamo.__scanExec.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Errore server" });
    });

    it("404 se ordini senza typeFood valido", async () => {
      mockedOrderDynamo.__scanExec.mockResolvedValue([
        { id: "1" },
        { id: "2", typeFood: "" },
      ]);

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Nessun ordine trovato" });
    });
  });
});
