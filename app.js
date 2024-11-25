require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const corsOptions = require("./config/corsOptions");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");

const router = require("./routes/patient");
const connectDB = require("./config/dbConnect");

const port = process.env.PORT || 3000;

// Middleware
// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

app.use(cors(corsOptions));

//built in middleware to handle urlencoded data
// in other words, form data:
// 'Content-Type: application/x-www-form-urlencoded'
app.use(express.urlencoded({ extended: false }));

//built in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

// Connect to the database
connectDB();

//routes
// app.get("/", (req, res) => res.send("vercel backend(NODEJS/EXPRESSJS) deployment successful!"))
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/login"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));

app.use("/api/patients", router);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
