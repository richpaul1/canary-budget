
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Mock data
const amountHeaders = ['Month1', 'Month2', 'Month3', 'Month4', 'Month5', 'Month6', 'Month7', 'Month8', 'Month9', 'Month10', 'Month11', 'Month12'];
const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let budgets = []
function parseCsvString(csvString) {
  try {
      const { data } = Papa.parse(csvString, { header: true });
      return data;    
  } catch (error) {
    console.log(error)
    return [];
  }
}

function parseCsvFile(filePath) {
  const csvString = fs.readFileSync(filePath, 'utf8');
  const { data } = Papa.parse(csvString, { header: true });
  return data;
}

function validateCsv(data) {
		if (!data.length) {
			return { valid: false, error: 'CSV is empty' };
		}

		const expectedHeaders = ['Budget', 'Year', 'Month', ...amountHeaders];
		const headers = Object.keys(data[0]);
		if (!expectedHeaders.every((h) => headers.includes(h))) {
			return { valid: false, error: `Invalid headers. Expected: ${expectedHeaders.join(', ')}` };
		}

		const seenBudgets = new Set();
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			if (!row.Budget) {
				return { valid: false, error: `Row ${i + 2}: Missing Budget name` };
			}
			const budget = budgets.find((b) => b.name === row.Budget);
			if (!budget) {
				return { valid: false, error: `Row ${i + 2}: Budget "${row.Budget}" not found` };
			}
			if (!row.Year) {
				return { valid: false, error: `Row ${i + 2}: Missing Year` };
			}
			const year = parseInt(row.Year);
			if (isNaN(year) || year < 2000 || year > 2100) {
				return { valid: false, error: `Row ${i + 2}: Invalid Year (${row.Year})` };
			}
			if (!monthOrder.includes(row.Month)) {
				return { valid: false, error: `Row ${i + 2}: Invalid Month (${row.Month})` };
			}
			const budgetYearKey = `${row.Budget}-${row.Year}-${row.Month}`;
			if (seenBudgets.has(budgetYearKey)) {
				return {
					valid: false,
					error: `Row ${i + 2}: Duplicate Budget-Year-Month combination (${row.Budget}, ${row.Year}, ${row.Month})`
				};
			}
			seenBudgets.add(budgetYearKey);
			for (const monthKey of amountHeaders) {
				const amount = parseFloat(row[monthKey]?.toString().replace(/,/g, ''));
				if (isNaN(amount) || amount <= 0) {
					return {
						valid: false,
						error: `Row ${i + 2}: Invalid amount for ${monthKey} (${row[monthKey]})`
					};
				}
			}
		}

		return { valid: true };
	}


// Test cases
describe('validateCsv', () => {
  it('should return error if CSV is empty', () => {
    const csv = "";
    const data = parseCsvString(csv)
    const result = validateCsv(data);
    expect(result).toEqual({ valid: false, error: 'CSV is empty' });
  });

  it('should return error if Year is missing or are invalid', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test2.csv'));
    const result = validateCsv(csv);
    console.log(JSON.stringify(result),null,2)
    expect(result).toEqual({ valid: false, error: `Row 2: Missing Year` });
  });

  it('should return error if Budget name is missing', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test3.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: 'Row 2: Missing Budget name' });
  });


  it('should return error if Year is invalid', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test4.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: 'Row 2: Invalid Year (20)' });
  });

  it('should return error if Month is invalid', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test5.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: `Row 2: Invalid Month (Jan)` });
  });

  it('should return error if Budget-Year-Month combination is duplicate', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test6.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: 'Row 3: Duplicate Budget-Year-Month combination (Test1, 2001, January)' });
  });

  it('should return error if amount is invalid', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test7.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: 'Row 2: Invalid amount for Month1 ()' });
  });
  
  it('should return error if amount is invalid', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test71.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: 'Row 2: Invalid amount for Month1 (-100)' });
  });

  it('should return valid if all validations pass', () => {
    budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test8.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: true });
  });

  it('should return budget not found', () => {
     budgets = [{ name: "Test1" }]
    const csv = parseCsvFile(path.join(__dirname, 'test9.csv'));
    const result = validateCsv(csv);
    expect(result).toEqual({ valid: false, error: 'Row 2: Budget \"Test2\" not found' });
  });

});