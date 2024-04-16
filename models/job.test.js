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
    title: "new",
    salary: 5,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({ ...newJob, id: expect.any(Number) });
  });

  test("bad request error if dupe", async function () {
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
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0.01",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0.3",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j4",
        salary: 400000,
        equity: "0.4",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get(id) */

describe("get", function () {
  //create a new job
  let newJob = {
    title: "new",
    salary: 5,
    equity: "0.5",
    companyHandle: "c1",
  };
  //create the job and capture the returned job object
  test("create job works", async function () {
    let createdJob = await Job.create(newJob);
    const job = await Job.get(createdJob.id);
    expect(job).toEqual({
      id: createdJob.id,
      title: "new",
      salary: 5,
      equity: "0.5",
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

/************************************** update */

describe("patch", function () {
  test("works", async function () {
    let job = await db.query(`SELECT id, title FROM jobs WHERE title = 'j1'`);
    const jobId = job.rows[0].id;
    let data = { title: "j-new" };
    await Job.update(jobId, data);

    job = await db.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);

    expect(job.rows[0]).toEqual({
      id: jobId,
      title: "j-new",
      salary: 100000,
      equity: "0.01",
      company_handle: "c1",
    });
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let job = await db.query(`SELECT id, title FROM jobs WHERE title = 'j1'`);
    const jobId = job.rows[0].id;
    await Job.remove(jobId);
    const res = await db.query("SELECT * FROM jobs WHERE title='j1'");
    expect(res.rows.length).toEqual(0);
  });
});
