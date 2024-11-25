require("dotenv").config();
const sql = require("mssql");

// go to mssql configuration and select on the network and make sure to enable TCP/IP and also in the props the port is set to 1433
// enable login using both windows and SQL server authentication by going to security in the props of the db server(which is the top level mostly having your pc name)
// then make sure to restart the service of mssql by returning to mssql configuration and after that it is running.
// Database configuration
const config = {
  user: process.env.USER,
  password: process.env.PASSWORD,
  server: "localhost",
  database: "test",
  options: {
    encrypt: false, // Change to true if you're using Azure
  },
};

// Function to connect to the database
const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log("Connected to MSSQL database");

    // Check if the Patient table exists
    const result =
      await sql.query`SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Patient'`;
    if (result.recordset.length === 0) {
      // If the table doesn't exist, create it
      await sql.query`
        CREATE TABLE Patient (
          id INT IDENTITY(1,1) PRIMARY KEY,
          fullName NVARCHAR(255),
          sex NVARCHAR(10),
          age NVARCHAR(10),
          phone NVARCHAR(20),
          email NVARCHAR(100),
          doctor NVARCHAR(100),
          injury NVARCHAR(255),
          dateOfVisit DATETIME
        )
      `;
      console.log("Patient table created");
    } else {
      console.log("Patient table already exists");
    }
  } catch (err) {
    console.error("Error connecting to MSSQL database:", err);
  }
};

module.exports = connectDB;
