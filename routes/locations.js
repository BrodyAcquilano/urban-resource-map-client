// routes/locations.js

import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  const db = req.app.locals.db;

  try {
    const locations = await db.collection("locations").find().toArray();
    res.json(locations);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

export default router;
