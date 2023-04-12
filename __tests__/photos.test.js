const request = require("supertest");
const app = require("./../app");
const { sequelize } = require("./../models/index");
const { queryInterface } = sequelize;
const { hash } = require("./../helpers/hash");
const { sign } = require("../helpers/jwt");

const user = {
  username: "acong",
  email: "acong@mail.com",
  password: "password",
  createdAt: new Date(),
  updatedAt: new Date(),
};

let userToken = sign({ id: 1, email: user.email });
let userNotExistsToken = sign({ id: 99, email: "notexists@mail.com" });
const defaultPhoto = {
  title: "Default Photo",
  caption: "Default Photo caption",
  image_url: "http://image.com/defaultphoto.png",
  createdAt: new Date(),
  updatedAt: new Date(),
  UserId: 1,
};

beforeAll(async () => {
  await queryInterface.bulkDelete("Photos", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await queryInterface.bulkDelete("Users", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  const hashedUser = { ...user };
  hashedUser.password = hash(hashedUser.password);
  userToken = await queryInterface.bulkInsert("Users", [hashedUser]);
  await queryInterface.bulkInsert("Photos", [defaultPhoto]);
});

afterAll(async () => {
  sequelize.close();
});

describe("GET /photos", () => {
  test("should return HTTP status code 200", async () => {
    const { body } = await request(app)
      .get("/photos")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    expect(body.length).toBe(1);
    expect(body[0]).toEqual({
      id: 1,
      title: defaultPhoto.title,
      caption: defaultPhoto.caption,
      image_url: defaultPhoto.image_url,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      UserId: 1,
    });
  });
  test("should return HTTP status code 401 when no authorization", async () => {
    const { body } = await request(app).get("/photos").expect(401);
    expect(body.message).toMatch(/unauthorized/i);
  });
  test("should return HTTP status code 401 when no token provided", async () => {
    const { body } = await request(app)
      .get("/photos")
      .set("Authorization", "Bearer ")
      .expect(401);
    expect(body.message).toMatch(/invalid token/i);
  });
  test("should return HTTP status code 401 when no token provided", async () => {
    const { body } = await request(app)
      .get("/photos")
      .set("Authorization", "Bearer wrong.token.input")
      .expect(401);
    expect(body.message).toMatch(/invalid token/i);
  });
  test("should return HTTP status code 401 when user does not exist", async () => {
    const { body } = await request(app)
      .get("/photos")
      .set("Authorization", `Bearer ${userNotExistsToken}`)
      .expect(401);
    expect(body.message).toMatch(/unauthorized/i);
  });

  //photosByID
  test("should return HTTP status code 200(specific data by id )", async () => {
    const { body } = await request(app)
      .get(`/photos/1`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(body).toEqual({
      id: 1,
      title: defaultPhoto.title,
      caption: defaultPhoto.caption,
      image_url: defaultPhoto.image_url,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      User: expect.any(Object),
    });
  });
  //PhotosByID with 404 status code.
  test("should return HTTP status code 404 when data  doesn't exist", async () => {
    const { body } = await request(app)
      .get("/photos/123")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(404);
    expect(body.message).toMatch(/data not found/i);
  });

  //test insert photo success
  test("should return HTTP status code 201 when data is inserted", async () => {
    const { body } = await request(app)
      .post("/photos")
      .send({
        id: 2,
        title: "Title Testing",
        caption: "Caption testing",
        image_url: "http://percobaan.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        UserId: 1,
      })
      .set("Authorization", `Bearer ${userToken}`)
      .expect(201);

    expect(body).toEqual({
      id: 2,
      title: "Title Testing",
      image_url: "http://percobaan.com",
      UserId: 1,
      caption: "TITLE TESTING http://percobaan.com",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  test("Should return 400 BAD request when there's empty field(image caption)", async () => {
    const { body } = await request(app)
      .post("/photos")
      .send({
        id: 2,
        title: "Title Testing",
        caption: "Caption testing",

        createdAt: new Date(),
        updatedAt: new Date(),
        UserId: 1,
      })
      .set("Authorization", `Bearer ${userToken}`)
      .expect(400);

    expect(body.message[0]).toMatch(/\b(cannot|URL)\b/g);
  });
});
