import request from "supertest";
import app from "../app";
import { UserDynamo } from "../models/userModel";
import * as bcrypt from "bcrypt";

jest.mock("../models/userModel", () => {
  const queryExec = jest.fn();
  const query = jest.fn().mockImplementation(() => ({
    using: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        exec: queryExec,
      }),
    }),
  }));

  return {
    UserDynamo: {
      query,
      create: jest.fn(),
      __queryExec: queryExec,
    },
  };
});

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedUserDynamo = UserDynamo as unknown as {
  create: jest.Mock;
  __queryExec: jest.Mock;
};

const mockedBcrypt = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue("hashed-password");
    mockedBcrypt.compare.mockResolvedValue(true);
  });

  it("POST /register → dovrebbe registrarmi", async () => {
    mockedUserDynamo.__queryExec.mockResolvedValue({ count: 0 });
    mockedUserDynamo.create.mockResolvedValue({});

    const res = await request(app).post("/auth/register").send({
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ message: "Utente creato" });
  });

  it("POST /register → dovrebbe registrarmi", async () => {
    mockedUserDynamo.__queryExec.mockResolvedValue({ count: 1 });

    const res = await request(app).post("/auth/register").send({
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(409);
  });

  it("POST /login → dovrebbe restituire un token", async () => {
    mockedUserDynamo.__queryExec.mockResolvedValue({
      count: 1,
      0: {
        id: "user-1",
        username: "test",
        email: "test@example.com",
        password: "hashed-password",
      },
    });
    mockedBcrypt.compare.mockResolvedValue(true);

    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("POST /login → credenziali sbagliate = 401", async () => {
    mockedUserDynamo.__queryExec.mockResolvedValue({ count: 0 });

    const res = await request(app).post("/auth/login").send({
      email: "wrong@example.com",
      password: "Password1!",
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /login → password errata = 401", async () => {
    mockedUserDynamo.__queryExec.mockResolvedValue({
      count: 1,
      0: {
        id: "user-1",
        username: "test",
        email: "test@example.com",
        password: "hashed-password",
      },
    });
    mockedBcrypt.compare.mockResolvedValue(false);

    const res = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "PasswordSbagliata1!",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Credenziali non valide" });
  });
});
