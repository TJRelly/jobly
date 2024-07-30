"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

// const jobNewSchema = require("../schemas/jobNew.json");
// const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFindSchema = require("../schemas/jobFind.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobNewSchema = require("../schemas/jobNew.json");

const router = new express.Router();

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * -
 * -
 * -
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    const q = req.query;

    if (q.hasEquity === "true") q.hasEquity = true;
    if (q.hasEquity === "false") q.hasEquity = false;

    if (q.minSalary) q.minSalary = +q.minSalary;

    try {
        const validator = jsonschema.validate(q, jobFindSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity }
 *
 * Returns { id, title, salary, equity }
 *
 * Authorization required: login
 */

router.post(
    "/",
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, jobNewSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const job = await Job.create(req.body);
            return res.status(201).json({ job });
        } catch (err) {
            return next(err);
        }
    }
);

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { id, title, salary, equity }
 *
 * Returns { id, title, salary, equity }
 *
 * Authorization required: login
 */

router.patch(
    "/:id",
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, jobUpdateSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const job = await Job.update(req.params.id, req.body);
            return res.json({ job });
        } catch (err) {
            return next(err);
        }
    }
);

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete(
    "/:id",
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            await Job.remove(req.params.id);
            return res.json({ deleted: req.params.id });
        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;
