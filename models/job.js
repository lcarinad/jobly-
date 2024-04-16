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
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create(data) {
    const duplicateCheck = await db.query(
      `SELECT title
           FROM jobs
           WHERE title= $1`,
      [data.title]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${data.title}`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle )
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{title, salary, equity, company}, ...]
   * */

  static async findAll(title, minSalary, hasEquity) {
    let query = `SELECT id, title, salary, equity, company_handle AS "companyHandle" 
      FROM jobs
      JOIN companies ON jobs.company_handle = companies.handle`;
    const values = [];
    if (title) {
      query += ` WHERE title ILIKE $${values.length + 1}`;
      values.push(`%${title}%`);
    }
    if (minSalary) {
      query += `${title ? " AND" : " WHERE"} salary >= $${values.length + 1}`;
      values.push(minSalary);
    }
    if (hasEquity === true) {
      query += `${title || minSalary ? " AND" : " WHERE"} equity > 0`;
    }
    const jobsRes = await db.query(query, values);
    if (!jobsRes.rows[0]) throw new NotFoundError(`No jobs are available.`);
    return jobsRes.rows;
  }

  /** Given a job id, return data about the job.
   *
   * Returns { title, salary, equity, companyName }
   *   where jobs is [{ title, salary, equity, company_handle}, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    let jobs = await db.query(
      `SELECT j.id, j.title, j.salary, j.equity, c.handle AS "companyHandle" FROM jobs AS "j" 
      JOIN companies AS "c" ON j.company_handle = c.handle 
      WHERE id = $1`,
      [id]
    );
    const job = jobs.rows[0];
    if (!job) throw new NotFoundError(`No job with the id of ${id}`);
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {title, salary, equity, company_handle}
   *
   * Throws NotFoundError if job not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with the id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
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

    if (!job) throw new NotFoundError(`No job with the id: ${id}`);
  }
}

module.exports = Job;
