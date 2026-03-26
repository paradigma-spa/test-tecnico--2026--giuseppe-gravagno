import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { Order } from "../models/orderModel";

jest.mock("../models/orderModel", () => {
  const Order = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  (Order as any).find = jest.fn();
  (Order as any).findById = jest.fn();
  (Order as any).aggregate = jest.fn();

  return { Order };
});

const mockedOrder = Order as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  aggregate: jest.Mock;
};

describe("Orders API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // PROVE GET

  it("GET /orders → dovrebbe restituire tutti gli ordini", async () => {
    mockedOrder.find.mockResolvedValue([]);

    const res = await request(app).get("/orders");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.allOrders)).toBe(true);
  });

  it("GET /orders/me → dovrebbe restituire gli ordini dell'utente", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrder.find.mockResolvedValue([
      { _id: "order-1", typeFood: "Pizza", quantity: 2, user: "user-1" },
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

    expect(Order).toHaveBeenCalledWith({
      typeFood: "Pizza",
      quantity: 2,
      user: "user-1",
    });
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

    const mockSave = jest.fn();

    mockedOrder.findById.mockResolvedValue({
      _id: "123",
      typeFood: "Pasta",
      quantity: 1,
      user: "user-1",
      save: mockSave,
    });

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

    expect(mockSave).toHaveBeenCalled();
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

    mockedOrder.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({ typeFood: "Pizza", quantity: 3 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      message: "Nessun ordine presente con l'id: 123",
    });
  });

  it("PATCH /orders/:id → 500 se ordine senza utente", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrder.findById.mockResolvedValue({
      _id: "123",
      typeFood: "Pasta",
      quantity: 1,
      user: null,
    });

    const res = await request(app)
      .patch("/orders/123")
      .set("Authorization", `Bearer ${token}`)
      .send({ typeFood: "Pizza" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Ordine senza utente (errore dati)",
    });
  });

  it("PATCH /orders/:id → 403 se utente diverso", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrder.findById.mockResolvedValue({
      _id: "123",
      typeFood: "Pasta",
      quantity: 1,
      user: "user-2",
      save: jest.fn(),
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

    mockedOrder.findById.mockRejectedValue(new Error("DB error"));

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

    const mockDeleteOne = jest.fn().mockResolvedValue({});

    mockedOrder.findById.mockResolvedValue({
      _id: "123",
      typeFood: "Pizza",
      quantity: 2,
      user: "user-1",
      deleteOne: mockDeleteOne,
    });

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: "Ordine con id 123 eliminato correttamente",
    });
    expect(mockDeleteOne).toHaveBeenCalled();
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

    mockedOrder.findById.mockResolvedValue(null);

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

    mockedOrder.findById.mockResolvedValue({
      _id: "123",
      typeFood: "Pizza",
      quantity: 2,
      user: "user-2",
      deleteOne: jest.fn(),
    });

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      message: "Non puoi eliminare questo ordine",
    });
  });

  it("DELETE /orders/:id → 500 se ordine senza utente", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrder.findById.mockResolvedValue({
      _id: "123",
      typeFood: "Pizza",
      quantity: 2,
      user: null,
    });

    const res = await request(app)
      .delete("/orders/123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      message: "Ordine senza utente (errore dati)",
    });
  });

  it("DELETE /orders/:id → 500 se errore server", async () => {
    const token = jwt.sign({ id: "user-1", username: "test" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    mockedOrder.findById.mockRejectedValue(new Error("DB error"));

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
      mockedOrder.aggregate.mockResolvedValue([{ _id: "Pizza", count: 3 }]);

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("mostPopular");
      expect(res.body).toHaveProperty("count");
    });

    it("404 se nessun ordine presente", async () => {
      mockedOrder.aggregate.mockResolvedValue([]);

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Nessun ordine trovato" });
    });

    it("500 se errore server", async () => {
      mockedOrder.aggregate.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/orders/most_order");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Errore server" });
    });
  });
});
