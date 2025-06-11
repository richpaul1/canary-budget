// In your src/routes/api/budgets/+server.js
import { json } from '@sveltejs/kit';
import 'dotenv/config'; // Load environment variables
import fetch from 'node-fetch'; // Import node-fetch for server-side requests

const apiKey = process.env.HARNESS_API_KEY;
const accountIdentifier = process.env.HARNESS_ACCOUNT_IDENTIFIER;
const apiUrl = 'https://app.harness.io/ccm/api'; // Adjust region if necessary


function createEntry(rec) {
  const [perspective, year, month, amount] = rec;
  const date = new Date(`${month} 1, ${year}`);
  const timestamp = date.getTime();
  return { time: timestamp, value: parseFloat(amount) * 10 }; // Assuming amount needs to be multiplied by 10
}

// New POST handler
export const POST = async ({ request }) => {
  if (!apiKey || !accountIdentifier) {
    return json({ error: 'API key or Account Identifier not configured' }, { status: 500 });
  }

  const body = await request.json();

  console.log("POST budgets ...")
  if(!body.oldbudget){
    return json({ success:false, error: 'No Existing Budget Selected' }, { status: 400 });
  }

  const existingBudget = body.oldbudget;
  let newMonthlyAmounts = body.monthlyAmounts ;

  //console.log("Monthly amounts \n"+JSON.stringify(newMonthlyAmounts))

  let total = 0;
  let monthlyRecords = []
  newMonthlyAmounts.forEach((line) => {
    total += line.value
    monthlyRecords.push(line)
  })

 const payload = {
    accountId : accountIdentifier,
    name: existingBudget.name,
    type: existingBudget.type,
    period: existingBudget.period,
    budgetAmount: total,
    scope: {
      viewName: existingBudget.scope.viewName,
      type: existingBudget.scope.type,
      viewId: existingBudget.scope.viewId
    },
    budgetMonthlyBreakdown: {
      budgetBreakdown : "MONTHLY",
      budgetMonthlyAmount : monthlyRecords
    },
  }


  let id = existingBudget.uuid;
  let postUrl = `${apiUrl}/budgets/${id}?accountIdentifier=${accountIdentifier}`;
  console.log("POST budgets ...", postUrl)
  console.log("POST budgets ...", JSON.stringify(payload,null,2))
  
  try {
    // You can adjust the endpoint and payload as needed
    const response = await fetch(postUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return json({ error: `Failed to upload budget: ${response.statusText}`, details: errorData }, { status: response.status });
    }

    const result = await response.json();
    return json({ success: true, result });
  } catch (error) {
    console.error('Error uploading budget:', error);
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
};

export const GET = async (params) => {

  console.log("loading budgets ...")
  if (!apiKey || !accountIdentifier) {
    console.error('HARNESS_API_KEY or HARNESS_ACCOUNT_IDENTIFIER environment variables not set.');
    return json({ error: 'API key or Account Identifier not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}/budgets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-account-id': accountIdentifier,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching budgets:', errorData);
      return json({ error: `Failed to fetch budgets: ${response.statusText}` }, { status: response.status });
    }

    const budgets = await response.json();
    //console.log("Budgets loaded ...", JSON.stringify(budgets, null, 2));
    if (budgets && budgets.data && Array.isArray(budgets.data)) {
      budgets.data.forEach(budget => {
        console.log(`Name: ${budget.name}, Amount: ${budget.budgetAmount}`);
      });
    }
    return json(budgets)
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}