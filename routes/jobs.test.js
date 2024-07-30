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

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "j4",
        salary: 125000,
        equity: 0.35,
        companyHandle: "c1",
    };

    test("ok for admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                ...newJob,
                equity: "0.35",
            },
        });
    });

    test("error for nonadmin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("throws error for nonusers", async function () {
        const resp = await request(app).post("/jobs").send(newJob);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                handle: "new",
                numEmployees: 10,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: "wrong format",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

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

    describe("GET /jobs with filter: title", function () {
        test("works", async function () {
            const resp = await request(app).get("/jobs?title=j3");

            expect(resp.body).toEqual({
                jobs: [
                    {
                        title: "j3",
                        salary: 50000,
                        equity: null,
                        companyHandle: "c3",
                    },
                ],
            });
        });
    });

    describe("GET /jobs with filter: salary", function () {
        test("works", async function () {
            const resp = await request(app).get("/jobs?minSalary=75000");

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
                ],
            });
        });
    });

    describe("GET /jobs with filter: equity", function () {
        test("works", async function () {
            const resp = await request(app).get("/jobs?hasEquity=true");

            expect(resp.body).toEqual({
                jobs: [
                    {
                        title: "j1",
                        salary: 100000,
                        equity: "0.1",
                        companyHandle: "c1",
                    },
                ],
            });
        });
    });

    describe("GET /jobs with filters 2 of 3: title, equity", function () {
        test("works", async function () {
            const resp = await request(app).get(
                "/jobs?title=j&hasEquity=false"
            );

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
    });

    describe("GET /jobs with filter: no title", function () {
        test("query string name error", async function () {
            try {
                await request(app).get("/jobs?title=");
            } catch (err) {
                expect(err instanceof BadRequestError).toBeTruthy();
            }
        });
    });

    describe("GET /jobs with filter: equity error", function () {
        test("query string equity error", async function () {
            try {
                await request(app).get("/jobs?equity=banana");
            } catch (err) {
                expect(err instanceof BadRequestError).toBeTruthy();
            }
        });
    });

    describe("GET /jobs with filter: salary error", function () {
        test("query string salary error", async function () {
            try {
                await request(app).get("/jobs?salary=-1");
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

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

// /************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", function () {
    test("works for admin only", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId}`)
            .send({
                title: "new-j1",
                salary: 75000,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({
            job: {
                id: jobId,
                title: "new-j1",
                salary: 75000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("unauth error for non admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId}`)
            .send({
                title: "new-j1",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth error for non users", async function () {
        const resp = await request(app).patch(`/jobs/${jobId}`).send({
            title: "new-j1",
        });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found: if no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "no job",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobId}`)
            .send({
                equity: "0.5",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobId}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: `${jobId}` });
    });

    test("unauth for anon", async function () {
        const resp = await request(app).delete(`/jobs/${jobId}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for non admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobId}`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
