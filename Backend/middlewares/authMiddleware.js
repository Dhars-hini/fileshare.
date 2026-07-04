const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ msg: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ msg: "Invalid token format" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId =
      decoded.id || decoded._id || decoded.userId ||
      decoded.user?.id || decoded.user?._id;

    if (!userId)
      return res.status(401).json({ msg: "Token missing user id" });

    req.user = { id: userId };
    next();
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = authMiddleware;
