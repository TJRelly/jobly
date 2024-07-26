"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, company_handle  }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT title, company_handle
           FROM jobs
           WHERE title = $1
           AND company_handle = $2`,
            [title, companyHandle]
        );

        if (duplicateCheck.rows[0])
            throw new BadRequestError(
                `Duplicate job: ${title} at ${companyHandle}`
            );

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );
        const job = result.rows[0];

        return job;
    }

    // /** Find all companies.
    //  *
    //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
    //  * */

    // static async findAll(filters) {
    //     let baseQuery = `SELECT handle,
    //                            name,
    //                            description,
    //                            num_employees AS "numEmployees",
    //                            logo_url AS "logoUrl"
    //                     FROM companies`;

    //     if (filters) {
    //         const whereExpressions = [];
    //         const { name, minEmployees, maxEmployees } = filters;

    //         //throw error if invalid employee data
    //         if (+filters.minEmployees > +filters.maxEmployees)
    //             throw new BadRequestError(
    //                 "Minimum employees can not be greater than max employees"
    //             );

    //         // add-ons only if they exist
    //         if (name) whereExpressions.push(`name ILIKE '%${name}%'`);
    //         if (minEmployees)
    //             whereExpressions.push(`num_employees >= ${minEmployees}`);
    //         if (maxEmployees)
    //             whereExpressions.push(`num_employees <= ${maxEmployees}`);

    //         if (whereExpressions.length > 0)
    //             baseQuery += " WHERE " + whereExpressions.join(" AND ");
    //     }

    //     //puts company list in alphabetical order
    //     baseQuery += " ORDER BY name";

    //     const companiesRes = await db.query(baseQuery);
    //     return companiesRes.rows;
    // }

    // /** Given a company handle, return data about company.
    //  *
    //  * Returns { handle, name, description, numEmployees, logoUrl, jobs }
    //  *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
    //  *
    //  * Throws NotFoundError if not found.
    //  **/

    // static async get(handle) {
    //     const companyRes = await db.query(
    //         `SELECT handle,
    //               name,
    //               description,
    //               num_employees AS "numEmployees",
    //               logo_url AS "logoUrl"
    //        FROM companies
    //        WHERE handle = $1`,
    //         [handle]
    //     );

    //     const company = companyRes.rows[0];

    //     if (!company) throw new NotFoundError(`No company: ${handle}`);

    //     return company;
    // }

    // /** Update company data with `data`.
    //  *
    //  * This is a "partial update" --- it's fine if data doesn't contain all the
    //  * fields; this only changes provided ones.
    //  *
    //  * Data can include: {name, description, numEmployees, logoUrl}
    //  *
    //  * Returns {handle, name, description, numEmployees, logoUrl}
    //  *
    //  * Throws NotFoundError if not found.
    //  */

    // static async update(handle, data) {
    //     const { setCols, values } = sqlForPartialUpdate(data, {
    //         numEmployees: "num_employees",
    //         logoUrl: "logo_url",
    //     });
    //     const handleVarIdx = "$" + (values.length + 1);

    //     const querySql = `UPDATE companies
    //                   SET ${setCols}
    //                   WHERE handle = ${handleVarIdx}
    //                   RETURNING handle,
    //                             name,
    //                             description,
    //                             num_employees AS "numEmployees",
    //                             logo_url AS "logoUrl"`;
    //     const result = await db.query(querySql, [...values, handle]);
    //     const company = result.rows[0];

    //     if (!company) throw new NotFoundError(`No company: ${handle}`);

    //     return company;
    // }

    // /** Delete given company from database; returns undefined.
    //  *
    //  * Throws NotFoundError if company not found.
    //  **/

    // static async remove(handle) {
    //     const result = await db.query(
    //         `DELETE
    //        FROM companies
    //        WHERE handle = $1
    //        RETURNING handle`,
    //         [handle]
    //     );
    //     const company = result.rows[0];

    //     if (!company) throw new NotFoundError(`No company: ${handle}`);
    // }
}

module.exports = Job;
