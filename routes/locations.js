// routes/locations.js

import express from "express";
const router = express.Router();

// GET - Fetch All Locations
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const collectionName = req.query.collectionName;

  if (!collectionName) {
    return res.status(400).json({ error: "Missing collection name." });
  }

  try {
    const locations = await db.collection(collectionName).find().toArray();
    res.json(locations);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

export default router;
