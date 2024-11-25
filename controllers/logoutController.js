const sql = require("mssql");

const handleLogout = async (req, res) => {
  try {
    // On client, also delete the accessToken
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    const pool = await sql.connect();

    // Check if refreshToken exists in the database
    const userQuery = await pool
      .request()
      .input("refreshToken", sql.VarChar, refreshToken)
      .query("SELECT * FROM Users WHERE refreshToken LIKE '%' + @refreshToken + '%'");
    
    const foundUser = userQuery.recordset[0];
    if (!foundUser) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      return res.sendStatus(204);
    }

    // Remove refreshToken from the database
    const newRefreshTokenArray = JSON.parse(foundUser.refreshToken || "[]").filter(
      (rt) => rt !== refreshToken
    );

    await pool
      .request()
      .input("email", sql.VarChar, foundUser.email)
      .input("role", sql.VarChar, foundUser.role)
      .input("refreshToken", sql.VarChar, JSON.stringify(newRefreshTokenArray))
      .query(
        "UPDATE Users SET refreshToken = @refreshToken WHERE email = @email AND role = @role"
      );

    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true }); // secure: true - only serves on https
    return res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleLogout };
