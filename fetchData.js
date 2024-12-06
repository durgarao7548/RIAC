// Define the base API URL
const apiBaseURL = 'http://localhost:5000/api/getData';

// Function to fetch data from a specific table
function fetchTableData(tableName) {
    const outputElement = document.getElementById('display-content');

    // Show a loading message while fetching data
    outputElement.innerHTML = 'Fetching data, please wait...';

    // Make the API call
    fetch(`${apiBaseURL}?tableName=${tableName}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.success && data.data) {
                // Create a table dynamically
                const table = document.createElement('table');
                table.border = 1;

                // Create table header
                const headerRow = document.createElement('tr');
                Object.keys(data.data[0]).forEach((key) => {
                    const headerCell = document.createElement('th');
                    headerCell.textContent = key;
                    headerRow.appendChild(headerCell);
                });
                table.appendChild(headerRow);

                // Populate table rows
                data.data.forEach((row) => {
                    const dataRow = document.createElement('tr');
                    Object.values(row).forEach((value) => {
                        const cell = document.createElement('td');
                        cell.textContent = value;
                        dataRow.appendChild(cell);
                    });
                    table.appendChild(dataRow);
                });

                // Replace the output content with the table
                outputElement.innerHTML = '';
                outputElement.appendChild(table);
            } else {
                outputElement.innerHTML = 'No data found';
            }
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
            outputElement.innerHTML = `Error fetching data: ${error.message}`;
        });
}
