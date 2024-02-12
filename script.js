// Define the color scale
const colorScale = d3.scaleSequential(d3.interpolateRainbow);

// Sanitize column names to ensure they are valid CSS class names
function sanitizeClassName(column) {
    return column.replace(/\W+/g, '_');
}

// Determine the min and max values of a column
function getColumnRange(columnName, data) {
    const values = data.map(row => parseFloat(row[columnName])).filter(value => !isNaN(value));
    return { min: d3.min(values), max: d3.max(values) };
}

// Display data in a table and color cells based on their values
function displayData(data) {
    const table = d3.select("#dataDisplay").append("table");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    // Column names extracted from the first row of the data
    const columns = Object.keys(data[0]);

    // Append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(d => d);

    // Create a row for each object in the data and populate cells
    const rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    rows.selectAll("td")
        .data(d => columns.map(column => ({ column: sanitizeClassName(column), value: d[column] })))
        .enter()
        .append("td")
        .attr("class", d => d.column)
        .text(d => d.value);

    // For each column, determine its range and color its cells accordingly
    columns.forEach(column => {
        const { min, max } = getColumnRange(column, data);
        colorScale.domain([min, max]);

        rows.selectAll(`td.${sanitizeClassName(column)}`)
            .style("background-color", d => {
                const value = parseFloat(d.value);
                if (!isNaN(value)) {
                    return colorScale(value);
                }
                return null;  // Default background for non-numeric cells
            });
    });
}

// Load CSV data and call the displayData function
function loadCSV() {
    Papa.parse('FemaleRR_Fed_Fos_Left.csv', {
        download: true,
        header: true,
        complete: function (results) {
            displayData(results.data);
        }
    });
}

// Attach event listener to the button to load the CSV data
document.getElementById("loadCSVBtn").addEventListener("click", loadCSV);
