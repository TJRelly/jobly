"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getId,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "newTitle",
        salary: 100000,
        equity: null,
        companyHandle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'newTitle'
           AND company_handle = 'c1'`
        );

        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "newTitle",
                salary: 100000,
                equity: null,
                companyHandle: "c1",
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
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
        ]);
    });
});

// describe("findAll", function () {
//     test("works: with filter", async function () {
//         const filter = {
//             name: "c",
//             minEmployees: "2",
//             maxEmployees: "3",
//         };

//         let companies = await Company.findAll(filter);
//         expect(companies).toEqual([
//             {
//                 handle: "c2",
//                 name: "C2",
//                 description: "Desc2",
//                 numEmployees: 2,
//                 logoUrl: "http://c2.img",
//             },
//             {
//                 handle: "c3",
//                 name: "C3",
//                 description: "Desc3",
//                 numEmployees: 3,
//                 logoUrl: "http://c3.img",
//             },
//         ]);
//     });
// });

// describe("findAll", function () {
//     test("error: with invalid employee data", async function () {
//         const filter = {
//             name: "c",
//             minEmployees: "3",
//             maxEmployees: "2",
//         };
//         try {
//             await Company.findAll(filter);
//         } catch (err) {
//             expect(err instanceof BadRequestError).toBeTruthy();
//         }
//     });
// });

// /************************************** get */

describe("get", function () {
    test("works", async function () {
        let jobId = await getId();
        const job = await Job.get(jobId);
        expect(job).toEqual({
            title: "j1",
            salary: 100000,
            equity: "0.1",
            companyHandle: "c1",
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update
 *
 *
 */

describe("update", function () {
    const updateData = {
        title: "newTitle",
        salary: 200000,
        equity: "0.3",
    };

    test("works", async function () {
        let jobId = await getId();
        let job = await Job.update(jobId, updateData);
        expect(job).toEqual({
            id: jobId,
            companyHandle: "c1",
            ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'
           AND title = 'newTitle'`
        );

        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "newTitle",
                salary: 200000,
                equity: "0.3",
                company_handle: "c1",
            },
        ]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            salary: null,
            equity: null,
        };

        let jobId = await getId();
        let job = await Job.update(jobId, updateDataSetNulls);
        expect(job).toEqual({
            id: jobId,
            title: "j1",
            companyHandle: "c1",
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
               FROM jobs
               WHERE id = '${jobId}'`
        );
        expect(result.rows).toEqual([
            {
                id: jobId,
                title: "j1",
                salary: null,
                equity: null,
                company_handle: "c1",
            },
        ]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update("c1", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        let jobId = await getId();
        await Job.remove(jobId);
        const res = await db.query(`SELECT id FROM jobs WHERE id='${jobId}'`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
