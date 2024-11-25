const sql = require("mssql");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);

    const refreshToken = cookies.jwt;
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });

    const pool = await sql.connect();

    // Check if refreshToken exists in the database
    const userQuery = await pool
      .request()
      .input("refreshToken", sql.VarChar, refreshToken)
      .query("SELECT * FROM Users WHERE refreshToken LIKE '%' + @refreshToken + '%'");

    const foundUser = userQuery.recordset[0];

    // Detected refresh token reuse
    if (!foundUser) {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) return res.sendStatus(403); // Forbidden (expired)
          const { fullName, email, role } = decoded.userInfo;

          // Clear all refresh tokens for the hacked user
          await pool
            .request()
            .input("email", sql.VarChar, email)
            .input("role", sql.VarChar, role)
            .input("refreshToken", sql.VarChar, JSON.stringify([]))
            .query(
              "UPDATE Users SET refreshToken = @refreshToken WHERE email = @email AND role = @role"
            );
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
        const { fullName, email, role } = foundUser;

        if (err) {
          // Token expired
          await pool
            .request()
            .input("email", sql.VarChar, email)
            .input("role", sql.VarChar, role)
            .input("refreshToken", sql.VarChar, JSON.stringify(newRefreshTokenArray))
            .query(
              "UPDATE Users SET refreshToken = @refreshToken WHERE email = @email AND role = @role"
            );
          return res.sendStatus(403); // Forbidden
        }

        if (err || fullName !== decoded.userInfo.fullName) return res.sendStatus(403); // Forbidden

        // RefreshToken is valid
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
        await pool
          .request()
          .input("email", sql.VarChar, email)
          .input("role", sql.VarChar, role)
          .input(
            "refreshToken",
            sql.VarChar,
            JSON.stringify([...newRefreshTokenArray, newRefreshToken])
          )
          .query(
            "UPDATE Users SET refreshToken = @refreshToken WHERE email = @email AND role = @role"
          );

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
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
