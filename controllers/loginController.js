const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  try {
    const cookie = req.cookies;
    console.log(req.body);
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, role, and password are required!",
      });
    }

    const pool = await sql.connect();

    // Find user in the database
    const userQuery = await pool
      .request()
      .input("email", sql.VarChar, email)
      .input("role", sql.VarChar, role)
      .query("SELECT * FROM Users WHERE email = @email AND role = @role");

    const foundUser = userQuery.recordset[0];
    if (!foundUser) return res.sendStatus(401); // Unauthorized

    // Evaluate password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return res.sendStatus(401); // Unauthorized
    if (!foundUser.approved) return res.sendStatus(403); // Forbidden

    // Create JWTs
    const accessToken = jwt.sign(
      { userInfo: { fullName: foundUser.fullName, email, role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    const newRefreshToken = jwt.sign(
      { userInfo: { fullName: foundUser.fullName, email, role } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Handle refresh token reuse detection
    let newRefreshTokenArray = !cookie.jwt
      ? JSON.parse(foundUser.refreshToken || "[]")
      : JSON.parse(foundUser.refreshToken || "[]").filter((rt) => rt !== cookie.jwt);

    if (cookie?.jwt) {
      const refreshToken = cookie.jwt;
      const tokenQuery = await pool
        .request()
        .input("email", sql.VarChar, email)
        .input("role", sql.VarChar, role)
        .input("refreshToken", sql.VarChar, refreshToken)
        .query(
          "SELECT * FROM Users WHERE email = @email AND role = @role AND refreshToken LIKE '%' + @refreshToken + '%'"
        );

      if (!tokenQuery.recordset[0]) {
        console.log("Attempted refresh token reuse at login!");
        newRefreshTokenArray = []; // Clear all refresh tokens
      }

      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
    }

    // Update user with new refresh token
    newRefreshTokenArray.push(newRefreshToken);
    await pool
      .request()
      .input("email", sql.VarChar, email)
      .input("role", sql.VarChar, role)
      .input("refreshToken", sql.VarChar, JSON.stringify(newRefreshTokenArray))
      .query(
        "UPDATE Users SET refreshToken = @refreshToken WHERE email = @email AND role = @role"
      );

    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: `Success, Logged in as ${foundUser.fullName}!`,
      id: foundUser.id,
      email,
      fullName: foundUser.fullName,
      role,
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleLogin };
