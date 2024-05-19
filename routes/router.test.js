const request = require("supertest");
const express = require("express");
const router = express.Router;
const app = express();
app.use(express.json());

const baseURL = "http://localhost:3500/";

// Check whether the authentication is working properly
describe("POST /auth", () => {
  test('should return "Access Granted" with status code 200 for valid credentials', async () => {
    const response = await request(baseURL)
      .post(`auth`)
      .send({ userName: "mailyu@gmail.com", passWord: "12345678" });

    expect(response.status).toBe(200);
  });

  test('should return "Incorrect Credentials" for invalid credentials', async () => {
    const response = await request(baseURL)
      .post(`auth`)
      .send({ userName: "invalid@gmail.com", passWord: "invalid" });

    expect(response.status).toBe(401);
  });
});

// Check whether the account creation is working properly
describe("POST /register", () => {
  test('should return "Success" with status code 201 for valid credentials', async () => {
    const response = await request(baseURL).post(`register`).send({
      email: "mailyu4@gmail.com",
      firstName: "Mails",
      lastName: "Yus",
      designation: "Teacher",
      password: "12345678",
    });

    expect(response.status).toBe(201);
  });

  test('should return "Conflict" for existing credentials', async () => {
    const response = await request(baseURL).post(`register`).send({
      email: "mailyu@gmail.com",
      firstName: "Mail",
      lastName: "Yu",
      designation: "Teacher",
      password: "12345678",
    });

    expect(response.status).toBe(409);
  });
});
