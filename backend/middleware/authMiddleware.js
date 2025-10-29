// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- THIS IS THE FIX ---
    // The decoded payload is { user_id: ..., email: ..., iat: ..., exp: ... }
    // We must set req.user to the *entire* decoded object.
    req.user = decoded;
    // --- END OF FIX ---

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};