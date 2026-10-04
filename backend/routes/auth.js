const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "supersecretkeyformoimanager", {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "அனைத்து புலங்களையும் நிரப்பவும்!" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "இந்த மின்னஞ்சல் ஏற்கனவே பதிவாகியுள்ளது!" });
    }

    const user = await User.create({ name, email, password });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "செல்லாத பயனர் தரவு!" });
    }
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "மின்னஞ்சல் மற்றும் கடவுச்சொல் கட்டாயம்!" });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு!" });
    }
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

// @desc    Update user profile (name)
// @route   PUT /api/auth/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: "பெயர் கட்டாயம்!" });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name;
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "பயனர் கண்டறியப்படவில்லை!" });
    }
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
router.put("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "அனைத்து புலங்களையும் நிரப்பவும்!" });
    }

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: "கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது!" });
    } else {
      res.status(400).json({ message: "தற்போதைய கடவுச்சொல் தவறு!" });
    }
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

module.exports = router;
