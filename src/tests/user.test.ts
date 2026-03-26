import request from "supertest";
import app from "../app";
import { User } from "../models/userModel";
import { Order } from "../models/orderModel";

jest.mock("../models/userModel", () => {
  const User = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  (User as any).find = jest.fn();
  (User as any).findById = jest.fn();
  (User as any).aggregate = jest.fn();

  return { User };
});

jest.mock("../models/orderModel", () => ({
  Order: {
    aggregate: jest.fn(),
  },
}));

const mockedUser = User as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  aggregate: jest.Mock;
};

const mockedOrder = Order as unknown as { aggregate: jest.Mock };

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  // PROVE GET

  it("GET /users/all → dovrebbe restituire tutti gli utenti", async () => {
    mockedUser.find.mockResolvedValue([]);

    const res = await request(app).get("/users/all");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.allUsers)).toBe(true);
  });

  describe("GET /users/top_customer", () => {
    it("dovrebbe restituire il cliente con più ordini", async () => {
      mockedOrder.aggregate.mockResolvedValue([
        {
          _id: "user-1",
          totalOrders: 5,
          userData: { email: "mario@test.com" },
        },
      ]);

      const res = await request(app).get("/users/top_customer");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        topCustomer: "user-1",
        email: "mario@test.com",
        totalOrders: 5,
      });
    });

    it("dovrebbe filtrare per startDate e endDate passate come query", async () => {
      mockedOrder.aggregate.mockResolvedValue([
        {
          _id: "user-2",
          totalOrders: 3,
          userData: { email: "luigi@test.com" },
        },
      ]);

      const res = await request(app)
        .get("/users/top_customer")
        .query({ startDate: "2026-01-01", endDate: "2026-01-31" });

      expect(res.statusCode).toBe(200);
      expect(res.body.topCustomer).toBe("user-2");
      expect(res.body.email).toBe("luigi@test.com");
      expect(res.body.totalOrders).toBe(3);
    });

    it("404 se nessun ordine nel periodo", async () => {
      mockedOrder.aggregate.mockResolvedValue([]);

      const res = await request(app).get("/users/top_customer");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        message: "Nessun ordine trovato nel periodo",
      });
    });

    it("500 se errore server", async () => {
      mockedOrder.aggregate.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/users/top_customer");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Errore server" });
    });
  });
});
