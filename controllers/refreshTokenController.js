const sql = require("mssql");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", 
      // secure: true
     });

    // Check if refreshToken exists in the database
    const userQuery = await sql.query`
      SELECT * FROM Users WHERE refreshToken LIKE '%' + ${refreshToken} + '%'`;
    const foundUser = userQuery.recordset[0];

    // Detected refresh token reuse
    if (!foundUser) {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) return res.sendStatus(403); // Forbidden (expired)
          const { email, role } = decoded.userInfo;

          // Clear all refresh tokens for the hacked user
          await sql.query`
            UPDATE Users 
            SET refreshToken = ${JSON.stringify([])} 
            WHERE email = ${email} AND role = ${role}`;
        }
      );
      return res.sendStatus(403); // Forbidden
    }

    // Remove old refreshToken from the user's tokens
    const newRefreshTokenArray = JSON.parse(foundUser.refreshToken || "[]").filter(
      (rt) => rt !== refreshToken
    );

    // Evaluate JWT
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err || foundUser.fullName !== decoded.userInfo.fullName) {
          // Clear expired or invalid tokens
          await sql.query`
            UPDATE Users 
            SET refreshToken = ${JSON.stringify(newRefreshTokenArray)} 
            WHERE email = ${foundUser.email} AND role = ${foundUser.role}`;
          return res.sendStatus(403); // Forbidden
        }

        // RefreshToken is valid
        const { fullName, email, role } = decoded.userInfo;

        const accessToken = jwt.sign(
          { userInfo: { fullName, email, role } },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" }
        );

        const newRefreshToken = jwt.sign(
          { userInfo: { fullName, email, role } },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "1d" }
        );

        // Save new refreshToken in the database
        await sql.query`
          UPDATE Users 
          SET refreshToken = ${JSON.stringify([...newRefreshTokenArray, newRefreshToken])} 
          WHERE email = ${email} AND role = ${role}`;

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          sameSite: "None",
          // secure: true,
          maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({
          id: foundUser.id,
          email: foundUser.email,
          fullName: foundUser.fullName,
          role,
          accessToken,
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleRefreshToken };
