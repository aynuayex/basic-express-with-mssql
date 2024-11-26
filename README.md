# EXPRESS App with MSSQL Backend

This is a basic backend web application setup built using the EXPRESS node framework, with a MSSQL database.

## Prerequisites

Before running the application, ensure you have the following installed:

1. Node.js
2. MSSQL Server
3. MSSQL studio
4. git

# Getting Started

Follow these steps to run the application locally:

1. Clone the repository:

   `git clone https://github.com/aynuayex/basic-express-with-mssql
`

2. Navigate to the project directory:
   `cd your-project-directory
`

## Setting up the API

1. Install dependencies:
   `npm install`

2. Configure the MSSQL database connection in the .env file.

   create a file named `.env` in the root folder and paste the code shown below

```
PORT=3000
USER=yourusername
PASSWORD=yourpassword
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
```

please change the user value 'yourusername' and the password value 'yourpassword' to your mssql
studio login credentials and assure that the account has the neccessary privilage to create a database.

   Use Node.js REPL: Run the following commands in the Node.js runtime:

   `node`

   This opens the Node.js REPL (interactive environment). Then execute:

   `require('crypto').randomBytes(64).toString('hex');`

   It will generate a 64-byte random hex string for your secret.so run the above twice and paste it for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
   Finally you can exit the interactive environment(Node.js REPL) by entering `.exit` .

Make sure TCP/IP connections are enabled via [SQL Server Configuration Manager](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-configuration-manager?view=sql-server-ver16) to avoid No connection could be made because the target machine actively refused it. (os error 10061)

    Go to mssql configuration and select on the network and make sure to enable TCP/IP and also in the props the port is set to 1433
    enable login using both windows and SQL server authentication by going to security in the props of the db server(which is the top level mostly having your pc name)
    then make sure to restart the service of mssql by returning to mssql configuration and after that it is running.
    Database configuration

3. Start the backend server:
   `npm start`
