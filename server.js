const express = require('express');
const bodyParser = require('body-parser');
const mssql = require('mssql');
const cors = require('cors'); // Import CORS

const app = express();
const port = 5000;

// Middleware for parsing JSON and handling CORS
app.use(cors({ origin: '*' }));  // Allow all origins (use with caution in production)
app.use(bodyParser.json());
// SQL Server Configuration
const dbConfig = {
    user: 'sa', // Replace with your database username
    password: '@Durga123', // Replace with your database password
    server: 'BV_DURGA_RAO', // Replace with your server address if different
    database: 'UserLoginDB', // Replace with your database name
    options: {
        encrypt: true, // For secure connections
        trustServerCertificate: true, // For self-signed certificates
    },
};

// Login API
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Connect to the SQL Server
        const pool = await mssql.connect(dbConfig);

        // Query the database
        const result = await pool
            .request()
            .input('Username', mssql.VarChar, username)
            .input('PasswordHash', mssql.VarChar, password)
            .query(`
                SELECT * FROM Users 
                WHERE Username = @Username 
                  AND PasswordHash = @PasswordHash
            `);

        // Check login result
        if (result.recordset.length > 0) {
            res.status(200).json({ success: true, message: 'Login successful.' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

app.get('/api/getData', async (req, res) => {
    const { tableName } = req.query;
    console.log('Request received for table:', tableName); // Log the table name

    if (!tableName) {
        return res.status(400).json({ success: false, message: 'Table name is required.' });
    }

    try {
        const pool = await mssql.connect(dbConfig);
        console.log('Database connected');

        // Get the current time and calculate the date range for the past 24 hours
        const now = new Date();
        const fromDate = new Date(now);
        fromDate.setHours(now.getHours() - 24); // 24 hours ago, same time as current

        // Format dates to SQL-friendly format (YYYY-MM-DD HH:mm:ss)
        const formattedFromDate = fromDate.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
        const formattedToDate = now.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss




        // Define queries for specific tables
        let query;
        switch (tableName) {
            case 'ALarm_History':
                query = `
                    SELECT 
                        [SNo], 
                        [AlarmDescription], 
                        FORMAT([AlarmActivatedDateTime], 'dd MM yyyy HH:mm:ss') AS AlarmActivatedDateTime, 
                        FORMAT([AlarmDeActivatedDateTime], 'dd MM yyyy HH:mm:ss') AS AlarmDeActivatedDateTime,
                        CASE 
                            WHEN [AlarmDeActivatedDateTime] IS NOT NULL THEN 
                                FORMAT(
                                    DATEADD(SECOND, DATEDIFF(SECOND, [AlarmActivatedDateTime], [AlarmDeActivatedDateTime]), 0), 
                                    'HH:mm:ss'
                                )
                            ELSE 'Active'
                        END AS AlarmDuration, 
                        [Comment], 
                        [AlarmCommentBy], 
                        [Groupname]
                    FROM [dbo].[ALarm_History]
                    ORDER BY [AlarmActivatedDateTime] DESC;
                `;
                break;
            
            
                case 'LoginActivity1':       
                query = `
                    SELECT 
                        [Username],
                        [GroupName],
                        [Description],
                        [Comment],
                        [DateTime]
                    FROM (
                        SELECT 
                            [Username],
                            [GroupName],
                            [Description],
                            [Comment],
                            FORMAT([DateTime], 'dd MM yyyy HH:mm:ss') AS DateTime,
                            ROW_NUMBER() OVER (ORDER BY [DateTime] DESC) AS RowNumber
                        FROM [dbo].[LoginActivity1]
                    ) AS OrderedLoginActivity1
                    ORDER BY [RowNumber] ASC
                `;
                break;
            
            case 'SensorsData':
                // Make sure to filter DataOfSensors between formattedFromDate and formattedToDate
                query = `
                    SELECT [SNo],
                 [DateTime],
                    [RTS1],
                    [RTS2],
                    [RTS3],
                    [RTS4],
                    [RTS5],
                    [HSTS],
                    [CSTS]
                    FROM [dbo].[SensorsData]
              WHERE [DateTime] >= '${formattedFromDate}' AND [DateTime] <= '${formattedToDate}'
              Order By DateTime Asc
                `;
                break;
            case 'LoginLogout':
                query = `SELECT [Username],
                FORMAT([Login_Time], 'dd MM yyyy HH:mm:ss') AS Login_Time,
                 FORMAT([Logout_Time],'dd MM yyyy HH:mm:ss') AS Logout_Time,
                   [Description], 
                   [Group]
                   FROM [dbo].[LoginLogout] 
                   ORDER BY [Logout_Time] DESC, [Login_Time] DESC
                   `;
                break;
                case 'System_Alarms':
                    query = `
                        SELECT 
                            [SNo], 
                            FORMAT([Date], 'dd MM yyyy') AS Date,
                            FORMAT(DATEADD(SECOND, DATEDIFF(SECOND, 0, [Time]), CAST([Date] AS DATETIME)), 'HH:mm:ss') AS Time,
                            [Status], 
                            [SystemAlarms], 
                            [Username], 
                            [GroupName],
                            FORMAT(CAST([Date] AS DATETIME) + CAST([Time] AS DATETIME), 'dd MM yyyy HH:mm:ss') AS DateTime
                        FROM [dbo].[System_Alarms]
                        ORDER BY [Date] DESC, [Time] DESC;
                    `;
                    break;

            default:
        }

        const result = await pool.request().query(query);

        if (result.recordset.length > 0) {
            res.status(200).json({ success: true, data: result.recordset });
        } else {
            res.status(404).json({ success: false, message: 'No data found.' });
        }
    } catch (error) {
        console.error('Database error:', error.message || error);
        res.status(500).json({ success: false, message: `Internal server error: ${error.message || error}` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
