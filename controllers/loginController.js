const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  try {
    const cookies = req.cookies;
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, role, and password are required!" });
    }

    // Fetch user from the database
    const userQuery = await sql.query`
      SELECT * FROM Users WHERE email = ${email} AND role = ${role}`;
    const foundUser = userQuery.recordset[0];
    if (!foundUser) return res.sendStatus(401); // Unauthorized

    // Check password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return res.sendStatus(401); // Unauthorized
    if (!foundUser.approved) return res.sendStatus(403); // Forbidden

    // Create tokens
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

    // Handle reuse detection
    let newRefreshTokenArray = JSON.parse(foundUser.refreshToken || "[]").filter(
      (rt) => rt !== cookies?.jwt
    );

    if (cookies?.jwt && !newRefreshTokenArray.includes(cookies.jwt)) {
      console.log("Detected reuse of invalid refresh token.");
      newRefreshTokenArray = []; // Clear all tokens
    }

    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", 
      // secure: true
     });

    // Update database with the new refresh token
    newRefreshTokenArray.push(newRefreshToken);
    await sql.query`
      UPDATE Users
      SET refreshToken = ${JSON.stringify(newRefreshTokenArray)}
      WHERE email = ${email} AND role = ${role}`;

    // Send new refresh token as a cookie
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: "None",
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: `Logged in as ${foundUser.fullName}`,
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
