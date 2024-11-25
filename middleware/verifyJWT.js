const jwt = require("jsonwebtoken");

const verfiyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  console.log(authHeader); // Bearer token
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // invalid token(forbidden), expired?
    const { fullName, email, role } = decoded.userInfo;
    req.user = { fullName, email, role };
    next();
  });
};

module.exports = verfiyJWT;
