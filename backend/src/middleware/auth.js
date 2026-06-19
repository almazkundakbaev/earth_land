const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { query } = require("../db");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token || "";

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await query(
      "select id, email, full_name, profile_description, role, user_role_id, is_active from app_users where id = $1",
      [payload.sub],
    );
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "User is inactive" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { requireAuth };
