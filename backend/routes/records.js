const express = require("express");
const router = express.Router();
const Record = require("../models/Record");
const { protect } = require("../middleware/auth");

// @desc    Get all records for current user
// @route   GET /api/records
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const records = await Record.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

// @desc    Create a record
// @route   POST /api/records
// @access  Private
router.post("/", protect, async (req, res) => {
  const { relativeName, city, amount, grams, eventName, date, notes, mode, type } = req.body;

  try {
    if (!relativeName || !mode || !type) {
      return res.status(400).json({ message: "உறவினர் பெயர், முறை மற்றும் வகை கட்டாயம்!" });
    }

    if (mode === "cash" && amount === undefined) {
      return res.status(400).json({ message: "ரொக்க தொகை கட்டாயம்!" });
    }

    if (mode === "gold" && grams === undefined) {
      return res.status(400).json({ message: "தங்கத்தின் அளவு (கிராம்) கட்டாயம்!" });
    }

    const record = new Record({
      userId: req.user._id,
      relativeName,
      city: city || "",
      amount: mode === "cash" ? parseFloat(amount || 0) : 0,
      grams: mode === "gold" ? parseFloat(grams || 0) : 0,
      eventName: eventName || "",
      date: date ? new Date(date) : undefined,
      notes: notes || "",
      mode,
      type
    });

    const createdRecord = await record.save();
    res.status(201).json(createdRecord);
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

// @desc    Update a record
// @route   PUT /api/records/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  const { relativeName, city, amount, grams, eventName, date, notes, mode, type } = req.body;

  try {
    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "பதிவு கண்டறியப்படவில்லை!" });
    }

    // Check if user owns the record
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "அனுமதி மறுக்கப்பட்டது!" });
    }

    record.relativeName = relativeName !== undefined ? relativeName : record.relativeName;
    record.city = city !== undefined ? city : record.city;
    record.amount = mode === "cash" ? parseFloat(amount || 0) : record.amount;
    record.grams = mode === "gold" ? parseFloat(grams || 0) : record.grams;
    record.eventName = eventName !== undefined ? eventName : record.eventName;
    record.date = date ? new Date(date) : record.date;
    record.notes = notes !== undefined ? notes : record.notes;
    record.mode = mode !== undefined ? mode : record.mode;
    record.type = type !== undefined ? type : record.type;

    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

// @desc    Delete a record
// @route   DELETE /api/records/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "பதிவு கண்டறியப்படவில்லை!" });
    }

    // Check if user owns the record
    if (record.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "அனுமதி மறுக்கப்பட்டது!" });
    }

    await record.deleteOne();
    res.json({ message: "பதிவு நீக்கப்பட்டது!" });
  } catch (error) {
    res.status(500).json({ message: "சர்வர் பிழை: " + error.message });
  }
});

module.exports = router;
