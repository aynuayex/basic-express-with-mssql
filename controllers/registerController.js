const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleNewUser = async (req, res) => {
  try {
    console.log(req.body);
    const { fullName, email, password, confirmPassword, location, phoneNumber, role } = req.body;
    if (!fullName || !email || !password || !location || !phoneNumber || !role) {
      return res.status(400).json({
        message: "Full Name, email, password, location, phoneNumber, and role are required!",
      });
    }

    // Check for duplicate users
    const pool = await sql.connect();
    const duplicateCheck = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");
    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({
        message: "User already exists with that information. Please change Email!",
      });
    }

    // Encrypt password
    const hashedPwd = await bcrypt.hash(password, 10);

    // Create JWTs
    const accessToken = jwt.sign(
      { userInfo: { fullName, email, role } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { userInfo: { fullName, email, role } },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Insert new user into the database
    const result = await pool
      .request()
      .input("fullName", sql.VarChar, fullName)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPwd)
      .input("location", sql.VarChar, location)
      .input("phoneNumber", sql.VarChar, phoneNumber)
      .input("refreshToken", sql.VarChar, JSON.stringify([refreshToken]))
      .input("role", sql.VarChar, role)
      .query(
        `INSERT INTO Users (fullName, email, password, location, phoneNumber, refreshToken, role)
         OUTPUT INSERTED.id
         VALUES (@fullName, @email, @password, @location, @phoneNumber, @refreshToken, @role)`
      );

    const userId = result.recordset[0].id;

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: `New user ${fullName} with role ${role} created!`,
      id: userId,
      email,
      fullName,
      role,
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
