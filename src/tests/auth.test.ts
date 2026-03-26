import request from "supertest";
import app from "../app";
import { User } from "../models/userModel";

jest.mock("../models/userModel", () => {
  const User = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  (User as any).findOne = jest.fn();

  return { User };
});

const mockedUser = User as unknown as jest.Mock & { findOne: jest.Mock };

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /register → dovrebbe registrarmi", async () => {
    mockedUser.findOne.mockResolvedValue(null);

    const res = await request(app).post("/auth/register").send({
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ message: "Utente creato" });
  });

  it("POST /register → dovrebbe registrarmi", async () => {

    mockedUser.findOne.mockResolvedValue({
      _id: "user-1",
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });

    const res = await request(app).post("/auth/register").send({
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(409);
  });

  it("POST /login → dovrebbe restituire un token", async () => {
    mockedUser.findOne.mockResolvedValue({
      _id: "user-1",
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });

    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /login → credenziali sbagliate = 401", async () => {
    mockedUser.findOne.mockResolvedValue(null);

    const res = await request(app).post("/auth/login").send({
      email: "wrong@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(401);
  });
});