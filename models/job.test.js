"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
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
        const result = await db.query(
            `SELECT id
           FROM jobs
           WHERE title = 'j1'
           AND company_handle = 'c1'`
        );

        const jobId = result.rows[0].id
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

// /************************************** update */

// describe("update", function () {
//     const updateData = {
//         title: "newJ1",
//         salary: 200000,
//         equity: "0.3",
//     };

//     const id = job.get()

//     test("works", async function () {
//         let job = await Job.update("c1", updateData);
//         expect(job).toEqual({
//             id: expect.any(Number),
//             companyHandle: "c1"
//             ...updateData,
//         });

//         const result = await db.query(
//             `SELECT title, salary, equity, company_handle
//            FROM jobs
//            WHERE company_handle = 'c1'
//            AND title = 'newJ1'`
//         );

//         expect(result.rows).toEqual([
//             {
//                 id: expect.any(Number),
//                 title: "newJ1",
//                 salary: 200000,
//                 equity: "0.3",
//                 companyHandle: "c1"
//             },
//         ]);
//     });

//     test("works: null fields", async function () {
//         const updateDataSetNulls = {
//             salary: null,
//             equity: null
//         };

//         let job = await Job.update("c1", updateDataSetNulls);
//         expect(job).toEqual({
//             handle: "c1",
//             ...updateDataSetNulls,
//         });

//         const result = await db.query(
//             `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`
//         );
//         expect(result.rows).toEqual([
//             {
//                 handle: "c1",
//                 name: "New",
//                 description: "New Description",
//                 num_employees: null,
//                 logo_url: null,
//             },
//         ]);
//     });

//     test("not found if no such company", async function () {
//         try {
//             await Company.update("nope", updateData);
//             fail();
//         } catch (err) {
//             expect(err instanceof NotFoundError).toBeTruthy();
//         }
//     });

//     test("bad request with no data", async function () {
//         try {
//             await Company.update("c1", {});
//             fail();
//         } catch (err) {
//             expect(err instanceof BadRequestError).toBeTruthy();
//         }
//     });
// });

// /************************************** remove */

// describe("remove", function () {
//     test("works", async function () {
//         await Company.remove("c1");
//         const res = await db.query(
//             "SELECT handle FROM companies WHERE handle='c1'"
//         );
//         expect(res.rows.length).toEqual(0);
//     });

//     test("not found if no such company", async function () {
//         try {
//             await Company.remove("nope");
//             fail();
//         } catch (err) {
//             expect(err instanceof NotFoundError).toBeTruthy();
//         }
//     });
// });
