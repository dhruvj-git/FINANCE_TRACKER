const jwt = require("jsonwebtoken");

const checkToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      console.warn("⚠️ Invalid token in optional middleware");
    }
  }

  next();
};

module.exports = checkToken;
