const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM companies");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM users");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM jobs");

    await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

    await db.query(
        `
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
        [
            await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
            await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
        ]
    );

    await db.query(`
        INSERT INTO jobs(title, salary, equity, company_handle)
        VALUES ('j1', 100000, 0.1, 'c1'),
               ('j2', 75000, 0, 'c2'),
               ('j3', 50000, null, 'c3')`);
}

async function commonBeforeEach() {
    await db.query("BEGIN");
}

async function commonAfterEach() {
    await db.query("ROLLBACK");
}

async function commonAfterAll() {
    await db.end();
}

async function getId() {
    const findId = await db.query(
        `SELECT id
            FROM jobs
            WHERE title = 'j1'
            AND company_handle = 'c1'`
    );

    let jobId = findId.rows[0].id;
    return jobId;
}

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getId,
};
