const { BadRequestError } = require("../expressError");

/**Helper function to generate the SET clause for update queries in the database.
 *
 * dataToUpdate param is an object containing keys representing column names in the db and values representing the updated values for the columns.
 *
 * jsToSql param is an object that maps js camelCase keys to corresponding snake_case keys in the db
 *
 * Throws BadRequestError if data is not passed in to the func.
 *
 * Returns an object containing:
 * - setCols: A string representing the SET clause with column assignments.
 * - values: An array of values extracted from dataToUpdate.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
