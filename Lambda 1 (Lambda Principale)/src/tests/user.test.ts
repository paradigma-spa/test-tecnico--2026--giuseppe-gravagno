import request from "supertest";
import app from "../app";
import { UserDynamo } from "../models/userModel";
import { OrderDynamo } from "../models/orderModel";

jest.mock("../models/userModel", () => {
  const scanExec = jest.fn();
  const scan = jest.fn().mockReturnValue({
    exec: scanExec,
  });

  return {
    UserDynamo: {
      scan,
      get: jest.fn(),
      __scanExec: scanExec,
    },
  };
});

jest.mock("../models/orderModel", () => {
  const scanExec = jest.fn();
  const scan = jest.fn().mockReturnValue({
    exec: scanExec,
  });

  return {
    OrderDynamo: {
      scan,
      __scanExec: scanExec,
    },
  };
});

const mockedUserDynamo = UserDynamo as unknown as {
  get: jest.Mock;
  __scanExec: jest.Mock;
};

const mockedOrderDynamo = OrderDynamo as unknown as {
  __scanExec: jest.Mock;
};

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // PROVE GET

  it("GET /users/all → dovrebbe restituire tutti gli utenti", async () => {
    mockedUserDynamo.__scanExec.mockResolvedValue([]);

    const res = await request(app).get("/users/all");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.allUsers)).toBe(true);
  });

  describe("GET /users/top_customer", () => {
    it("dovrebbe restituire il cliente con più ordini", async () => {
      const recentDate1 = new Date();
      recentDate1.setDate(recentDate1.getDate() - 3);
      const recentDate2 = new Date();
      recentDate2.setDate(recentDate2.getDate() - 2);
      const recentDate3 = new Date();
      recentDate3.setDate(recentDate3.getDate() - 1);

      mockedOrderDynamo.__scanExec.mockResolvedValue([
        {
          id: "order-1",
          userId: "user-1",
          createdAt: recentDate1.toISOString(),
        },
        {
          id: "order-2",
          userId: "user-1",
          createdAt: recentDate2.toISOString(),
        },
        {
          id: "order-3",
          userId: "user-2",
          createdAt: recentDate3.toISOString(),
        },
      ]);
      mockedUserDynamo.get.mockResolvedValue({ email: "mario@test.com" });

      const res = await request(app).get("/users/top_customer");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        topCustomer: "user-1",
        email: "mario@test.com",
        totalOrders: 2,
      });
    });

    it("dovrebbe filtrare per startDate e endDate passate come query", async () => {
      mockedOrderDynamo.__scanExec.mockResolvedValue([
        {
          id: "order-10",
          userId: "user-2",
          createdAt: "2026-01-05T10:00:00.000Z",
        },
        {
          id: "order-11",
          userId: "user-2",
          createdAt: "2026-01-20T10:00:00.000Z",
        },
        {
          id: "order-12",
          userId: "user-2",
          createdAt: "2026-02-01T10:00:00.000Z",
        },
      ]);
      mockedUserDynamo.get.mockResolvedValue({ email: "luigi@test.com" });

      const res = await request(app)
        .get("/users/top_customer")
        .query({ startDate: "2026-01-01", endDate: "2026-01-31" });

      expect(res.statusCode).toBe(200);
      expect(res.body.topCustomer).toBe("user-2");
      expect(res.body.email).toBe("luigi@test.com");
      expect(res.body.totalOrders).toBe(2);
    });

    it("404 se nessun ordine nel periodo", async () => {
      mockedOrderDynamo.__scanExec.mockResolvedValue([]);

      const res = await request(app).get("/users/top_customer");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        message: "Nessun ordine trovato nel periodo",
      });
    });

    it("500 se errore server", async () => {
      mockedOrderDynamo.__scanExec.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/users/top_customer");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Errore server" });
    });
  });
});
