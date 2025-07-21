<div class="page-container">
    <p class="section-title">
        Help Documentation
    </p>
    <ul class="help-list">
        <li>Click <strong class="highlight-text">Download CSV Template</strong> to get a CSV Template file with the correct format.
        <img src="./template.png"/></li>
        <li>
            <pre class="code-block">
Budget,Year,Month,Month1,Month2,Month3,Month4,Month5,Month6,Month7,Month8,Month9,Month10,Month11,Month12
Test1,2025,January,100,200,300,400,500,600,700,800,900,1000,1100,1200
Test1,2025,March,100,200,300,400,500,600,700,800,900,1000,1100,1200
            </pre>
        </li>
        <li><strong class="highlight-text">Budget</strong> - Must match a named budget in Harness</li>
        <li><strong class="highlight-text">Year</strong> - The start year to use for the first Month </li>
        <li><strong class="highlight-text">Month</strong> - The month to start the budget from e.g. January, must match the starting month in Harness</li>
        <li><strong class="highlight-text">Month1</strong> - The budget amount for the start Month e.g. January = 100</li>
        <li><strong class="highlight-text">Month2</strong> - Start Month plus 1 e.g. February</li>
        <li>Must contain all 12 Months and values</li>
    </ul>
    
    <p class="section-title">
        Validation Rules
    </p>
    <p>
        The application applies the following validation rules to each row in the CSV file:
    </p>
    <ul class="help-list">
        <li><strong>CSV is not empty:</strong> The CSV file must contain at least one row of data.</li>
        <li><strong>Headers are valid:</strong> The CSV file must contain the expected headers.</li>
        <li><strong>Budget name is not empty:</strong> Each row must have a non-empty <code>Budget</code> name.</li>
        <li><strong>Budget is valid:</strong> Each <code>Budget</code> name must match one of the budget names in the system.</li>
        <li><strong>Year is present and valid:</strong> Each row must have a <code>Year</code> value between 2000 and 2100 inclusive.</li>
        <li><strong>Month is valid:</strong> Each row must have a valid <code>Month</code> value (one of the 12 month names).</li>
        <li><strong>No duplicate Budget-Year-Month combinations:</strong> Each combination of <code>Budget</code>, <code>Year</code>, and <code>Month</code> must be unique.</li>
        <li><strong>Amounts are valid:</strong> Each <code>Month1</code> to <code>Month12</code> value must be a non-negative number.</li>
    </ul>

    <hr class="separator">

    <p class="sub-section-title">Error Messages</p>

    <table class="data-table">
        <thead>
            <tr>
                <th>Error</th>
                <th>Error Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="error">Row 2: Budget "Example Budget" not found</td>
                <td>This is the exact line in your CSV file including the header. On line 2 we did not find the budget "Example Budget".</td>
            </tr>
            <tr>
                <td class="error">CSV is empty</td>
                <td>
                    No rows found to process.
                </td>
            </tr>
            <tr>
                <td class="error">Row 2 : Missing Year</td>
                <td>
                    The Year is missing e.g. 
                    <pre>
                        
Budget,Year,Month,Month1,Month2,Month3,Month4,Month5,Month6,Month7,Month8,Month9,Month10,Month11,Month12       
Test1<span class="error">,,</span>January,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00
        </pre>
                </td>
            </tr>
            <tr>
                <td class="error">Row 2: Invalid Year (20)</td>
                <td>
                    An invalid year - 20 was entered <br />
                    <pre>
                        
Budget,Year,Month,Month1,Month2,Month3,Month4,Month5,Month6,Month7,Month8,Month9,Month10,Month11,Month12       
Test1,<span class="error">20</span>,January,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00
        </pre>
                </td>
            </tr>
            <tr>
                <td class="error">Invalid headers. Expected: Budget, Year, Month, Month1, Month2, Month3, Month4, Month5, Month6, Month7, Month8, Month9, Month10, Month11, Month12 </td>
                <td>
                    The file is missing the header row. It is required.
                </td>
            </tr>
            <tr>
                <td class="error">Row 2: Invalid Month (Jan)</td>
                <td>
                    The Month should start with upper case first letter and be the full name. Here is an example of an error
                    <pre>
                        
Budget,Year,Month,Month1,Month2,Month3,Month4,Month5,Month6,Month7,Month8,Month9,Month10,Month11,Month12       
Test1,2001,<span class="error">Jan</span>,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00,1000.00
        </pre>
                </td>
            </tr>
            <tr>
                <td class="error">Row 3: Duplicate Budget-Year-Month combination (Test1, 2001, January)</td>
                <td>
                   It will look for duplicates e.g. Based on Budget, Year and Month.
                    <pre>
Budget,Year,Month,Month1,Month2,Month3,Month4,Month5,Month6,Month7,Month8,Month9,Month10,Month11,Month12
<span class="error">Test1,2001,January</span>,100,200,300,400,500,600,700,800,900,1000,1100,1200
<span class="error">Test1,2001,January</span>,100,200,300,400,500,600,700,800,900,1000,1100,1200
        </pre>
                </td>
            </tr>
            <tr>
                <td class="error">Row 2: Invalid amount for Month1 ()</td>
                <td>
                   Amounts have to be valid e.g. of invalid
                    <pre>
Budget,Year,Month,Month1,Month2,Month3,Month4,Month5,Month6,Month7,Month8,Month9,Month10,Month11,Month12
Test1,2001,January<span class="error">,,</span>200,300,400,500,600,700,800,900,1000,1100,1200        </pre>
                </td>
            </tr>
        </tbody>
    </table>
</div>

<style>
    /* Main Page Container Styles */
    .page-container {
        background-color: #1E1E1E; /* Dark background for the whole page/container */
        color: #E0E0E0; /* Light text for contrast */
        padding: 20px;
        font-family: Arial, sans-serif;
        line-height: 1.6;
        min-height: 100vh; /* Ensure it covers the full viewport height */
        box-sizing: border-box; /* Include padding in element's total width and height */
    }

    /* Headings */
    .section-title {
        font-size: 1.8em;
        font-weight: bold;
        color: #FFFFFF;
        margin-bottom: 20px;
    }

    .sub-section-title {
        font-size: 1.5em;
        font-weight: bold;
        color: #FFFFFF;
        margin-top: 30px;
        margin-bottom: 15px;
    }

    /* List Styles */
    .help-list {
        list-style-type: disc;
        margin-left: 20px;
        padding: 0;
    }

    .help-list li {
        margin-bottom: 10px;
    }

    /* Highlighted Text (e.g., strong tags) */
    .highlight-text {
        color: #61DAFB; /* A soft blue for emphasis */
    }

    .error {
        color: #e0032b; /* A soft blue for emphasis */
    }

    /* Code Block (pre tag) */
    .code-block {
        background-color: #282C34;
        color: #A9B1BD;
        padding: 15px;
        border-radius: 8px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        border: 1px solid #3B4049;
    }

    /* Inline Code (code tag within td) */
    .inline-code {
        background-color: #3B4049;
        padding: 3px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: #A9B1BD;
        font-size: 0.9em;
        white-space: nowrap;
    }

    /* Separator */
    .separator {
        border: 0;
        height: 1px;
        background-color: #3B4049; /* Subtle line for dark theme */
        margin: 40px 0;
    }

    /* Table Styles */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        color: #E0E0E0;
        background-color: #282C34;
        font-family: Arial, sans-serif;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .data-table thead {
        background-color: #3B4049;
        color: #FFFFFF;
    }

    .data-table th {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 2px solid #4F545E;
    }

    .data-table td {
        padding: 10px 15px;
    }

    .data-table tbody tr {
        border-bottom: 1px solid #3B4049;
    }

    /* Remove border from the last row in the table body */
    .data-table tbody tr:last-child {
        border-bottom: none;
    }
</style>