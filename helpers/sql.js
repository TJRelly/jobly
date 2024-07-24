/*
The sqlForPartialUpdate function generates SQL query components (columns and values) 
for performing a partial update operation on a database table based on the provided data.

{Object} dataToUpdate - An object containing key-value pairs of data to update.

{Object} jsToSql - An optional mapping object to convert JavaScript object keys to SQL column names.

{Object} - An object with `setCols` and `values` properties:
  - `setCols`: A string of comma-separated SQL column update statements.
  - `values`: An array of values extracted from `dataToUpdate`.
  
{BadRequestError} - Throws an error if `dataToUpdate` is empty.
*/

const { BadRequestError } = require("../expressError");

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Isolate the columns to be updated
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  /*
  Converts keys from input data into a sanitized SQL format
  {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2'] 
  */
  const cols = keys.map(
      (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  /*
  Returns an object containing formatted SQL columns 
  and their associated values to be passed into a SQL query
  */
  return {
      setCols: cols.join(", "),
      values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
