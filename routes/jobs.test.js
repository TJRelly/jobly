"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token,
} = require("./_testCommon");
const { BadRequestError } = require("../expressError");

let jobId;
// beforeAll(commonBeforeAll);
beforeAll(async () => {
    await commonBeforeAll(); // Setup common before all tests
    const result = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    jobId = result.rows[0].id; // Store the job ID retrieved from the database
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// /************************************** POST /jobs */

// describe("POST /jobs", function () {
//     const newJob = {
//         handle: "new",
//         name: "New",
//         logoUrl: "http://new.img",
//         description: "DescNew",
//         numEmployees: 10,
//     };

//     test("ok for admin users", async function () {
//         const resp = await request(app)
//             .post("/jobs")
//             .send(newJob)
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(201);
//         expect(resp.body).toEqual({
//             job: newJob,
//         });
//     });

//     test("error for nonadmin users", async function () {
//         const resp = await request(app)
//             .post("/jobs")
//             .send(newJob)
//             .set("authorization", `Bearer ${u2Token}`);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("throws error for nonusers", async function () {
//         const resp = await request(app).post("/jobs").send(newJob);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("bad request with missing data", async function () {
//         const resp = await request(app)
//             .post("/jobs")
//             .send({
//                 handle: "new",
//                 numEmployees: 10,
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(400);
//     });

//     test("bad request with invalid data", async function () {
//         const resp = await request(app)
//             .post("/jobs")
//             .send({
//                 ...newJob,
//                 logoUrl: "not-a-url",
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(400);
//     });
// });

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("gets list of jobs", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1",
                },
                {
                    title: "j2",
                    salary: 75000,
                    equity: "0",
                    companyHandle: "c2",
                },
                {
                    title: "j3",
                    salary: 50000,
                    equity: null,
                    companyHandle: "c3",
                },
            ],
        });
    });

    describe("GET /jobs with filter: no name", function () {
        test("query string name error", async function () {
            try {
                await request(app).get("/jobs?name=");
            } catch (err) {
                expect(err instanceof BadRequestError).toBeTruthy();
            }
        });
    });

    describe("GET /jobs with filter: num of employees error", function () {
        test("query string num of employees error", async function () {
            try {
                await request(app).get("/jobs?maxEmployees=-7");
            } catch (err) {
                expect(err instanceof BadRequestError).toBeTruthy();
            }
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        console.log(jobId);
        const resp = await request(app).get(`/jobs/${jobId}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    //     test("works for anon: job w/o jobs", async function () {
    //         const resp = await request(app).get(`/jobs/c2`);
    //         expect(resp.body).toEqual({
    //             job: {
    //                 handle: "c2",
    //                 name: "C2",
    //                 description: "Desc2",
    //                 numEmployees: 2,
    //                 logoUrl: "http://c2.img",
    //             },
    //         });
    //     });

        test("not found for no such job", async function () {
            const resp = await request(app).get(`/jobs/0`);
            expect(resp.statusCode).toEqual(404);
        });
});

// /************************************** PATCH /jobs/:handle */

// describe("PATCH /jobs/:handle", function () {
//     test("works for users", async function () {
//         const resp = await request(app)
//             .patch(`/jobs/c1`)
//             .send({
//                 name: "C1-new",
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.body).toEqual({
//             job: {
//                 handle: "c1",
//                 name: "C1-new",
//                 description: "Desc1",
//                 numEmployees: 1,
//                 logoUrl: "http://c1.img",
//             },
//         });
//     });

//     test("unauth error for non admin users", async function () {
//         const resp = await request(app)
//             .patch(`/jobs/c1`)
//             .send({
//                 name: "C1-new",
//             })
//             .set("authorization", `Bearer ${u2Token}`);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("unauth error for non users", async function () {
//         const resp = await request(app).patch(`/jobs/c1`).send({
//             name: "C1-new",
//         });
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("not found on no such job", async function () {
//         const resp = await request(app)
//             .patch(`/jobs/nope`)
//             .send({
//                 name: "new nope",
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(404);
//     });

//     test("bad request on handle change attempt", async function () {
//         const resp = await request(app)
//             .patch(`/jobs/c1`)
//             .send({
//                 handle: "c1-new",
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(400);
//     });

//     test("bad request on invalid data", async function () {
//         const resp = await request(app)
//             .patch(`/jobs/c1`)
//             .send({
//                 logoUrl: "not-a-url",
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(400);
//     });
// });

// /************************************** DELETE /jobs/:handle */

// describe("DELETE /jobs/:handle", function () {
//     test("works for users", async function () {
//         const resp = await request(app)
//             .delete(`/jobs/c1`)
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.body).toEqual({ deleted: "c1" });
//     });

//     test("unauth for anon", async function () {
//         const resp = await request(app).delete(`/jobs/c1`);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("not found for no such job", async function () {
//         const resp = await request(app)
//             .delete(`/jobs/nope`)
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(404);
//     });
// });
