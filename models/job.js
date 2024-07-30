"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

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

    /** Find all jobs.
     *
     * Returns [{ title, salary, equity, companyHandle }, ...]
     * */

    static async findAll(filters) {
        
        let baseQuery = `SELECT title, salary, equity, company_handle AS "companyHandle"
                        FROM jobs`;

        if (filters) {
            const whereExpressions = [];
            const { name, minEmployees, maxEmployees } = filters;

            //throw error if invalid employee data
            if (+filters.minEmployees > +filters.maxEmployees)
                throw new BadRequestError(
                    "Minimum employees can not be greater than max employees"
                );

            // add-ons only if they exist
            if (name) whereExpressions.push(`name ILIKE '%${name}%'`);
            if (minEmployees)
                whereExpressions.push(`num_employees >= ${minEmployees}`);
            if (maxEmployees)
                whereExpressions.push(`num_employees <= ${maxEmployees}`);

            if (whereExpressions.length > 0)
                baseQuery += " WHERE " + whereExpressions.join(" AND ");
        }

        //puts company list in alphabetical order
        baseQuery += " ORDER BY title";
        
        const jobsRes = await db.query(baseQuery);
        return jobsRes.rows;
    }

    /** Given a job title and company handle, return data about job.
     *
     * Returns { title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
            [id]
        );

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: at ${id}`);

        return job;
    }

    /** Update company data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, description, numEmployees, logoUrl}
     *
     * Returns {handle, name, description, numEmployees, logoUrl}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {
            companyHandle: "company_handle",
        });
        const idVarIdx = "$" + (values.length + 1);
        const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id, 
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${job}`);

        return job;
    }

    /** Delete given company from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
