require("dotenv").config();
const sql = require("mssql");

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

    // Check if the Users table exists
    const result =
      await sql.query`SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users'`;
    if (result.recordset.length === 0) {
      // If the table doesn't exist, create it
      await sql.query`
        CREATE TABLE Users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          fullName NVARCHAR(255) NOT NULL,
          email NVARCHAR(100) NOT NULL UNIQUE,
          password NVARCHAR(MAX) NOT NULL,
          location NVARCHAR(255) NOT NULL,
          phoneNumber NVARCHAR(20) NOT NULL,
          role NVARCHAR(50) NOT NULL,
          refreshToken NVARCHAR(MAX),
          approved BIT DEFAULT 0,
          createdAt DATETIME DEFAULT GETDATE()
        )
      `;
      console.log("Users table created");
    } else {
      console.log("Users table already exists");
    }
  } catch (err) {
    console.error("Error connecting to MSSQL database:", err);
  }
};

module.exports = connectDB;
