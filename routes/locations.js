// routes/locations.js

import express from "express";
import { ObjectId } from "mongodb";
import { getMongoClient } from "../db.js";

const router = express.Router();

// Extract database name from Mongo URI
function getDatabaseName(uri) {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.split("/")[1];
    return dbName || "test"; // Fallback if no database is provided
  } catch (err) {
    console.error("Invalid Mongo URI format:", err);
    return null;
  }
}

// GET - Fetch All Locations
router.get("/", async (req, res) => {
  const { mongoURI, collectionName } = req.query;

  if (!mongoURI || !collectionName) {
    return res.status(400).json({ error: "Missing mongoURI or collection name." });
  }

  const client = await getMongoClient(mongoURI);
  const dbName = getDatabaseName(mongoURI);

  if (!dbName) {
    return res.status(400).json({ error: "Invalid MongoDB URI format (no database specified)." });
  }

  const db = client.db(dbName);

  try {
    const locations = await db.collection(collectionName).find().toArray();
    res.json(locations);
  } catch (err) {
    console.error("Fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});
