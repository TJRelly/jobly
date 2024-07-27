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

/** GET /[handle]  =>  { job }
 *
 *  Job is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.handle);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** POST / { job } =>  { job }
 *
 * job should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
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
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch(
    "/:handle",
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, jobUpdateSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const job = await Job.update(req.params.handle, req.body);
            return res.json({ job });
        } catch (err) {
            return next(err);
        }
    }
);

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete(
    "/:handle",
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            await Job.remove(req.params.handle);
            return res.json({ deleted: req.params.handle });
        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;
