const jwt = require("jsonwebtoken");
const secret = "mySecret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1️⃣ No Authorization header
  if (!authHeader) {
    return res.status(401).json("Authorization header missing");
  }

  // 2️⃣ Expect: Bearer <token>
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json("Invalid authorization format");
  }

  const token = parts[1];

  try {
    // 3️⃣ Verify token
    const decoded = jwt.verify(token, secret);

    // 4️⃣ Attach userId to request
    req.userId = decoded.userId;

    next();
  } catch (err) {
    // 5️⃣ Invalid / expired token
    return res.status(401).json("Invalid or expired token");
  }
}

module.exports = authMiddleware;
