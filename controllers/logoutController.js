const sql = require("mssql");

const handleLogout = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;

    // Find user with the provided refresh token
    const userQuery = await sql.query`
      SELECT * FROM Users WHERE refreshToken LIKE '%' + ${refreshToken} + '%'`;
    const foundUser = userQuery.recordset[0];

    if (foundUser) {
      // Remove the refresh token from the database
      const updatedTokens = JSON.parse(foundUser.refreshToken || "[]").filter(
        (rt) => rt !== refreshToken
      );

      await sql.query`
        UPDATE Users
        SET refreshToken = ${JSON.stringify(updatedTokens)}
        WHERE email = ${foundUser.email} AND role = ${foundUser.role}`;
    }

    // Clear the cookie regardless of user existence
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", 
      // secure: true
     });
    res.sendStatus(204); // No content
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleLogout };
