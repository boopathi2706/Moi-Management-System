const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkeyformoimanager");

      // Get user from database (exclude password field)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "பயனர் கண்டறியப்படவில்லை, அங்கீகரிக்கப்படவில்லை!" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "அங்கீகரிக்கப்படாத அணுகல், செல்லாத டோக்கன்!" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "அங்கீகரிக்கப்படாத அணுகல், டோக்கன் வழங்கப்படவில்லை!" });
  }
};

module.exports = { protect };
