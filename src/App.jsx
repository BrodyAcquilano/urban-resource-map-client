// ─────────────────────────────────────────────
// 📦 External Library Imports
// ─────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";

// ─────────────────────────────────────────────
// 📫 API HELPERS
// ─────────────────────────────────────────────
import { fetchAllSchemas } from "./utils/schemaFetcher.js";

// ─────────────────────────────────────────────
// 🧩 Core Component Imports
// ─────────────────────────────────────────────
import Header from "./components/Header.jsx";
import FilterPanel from "./components/FilterPanel.jsx";
import MapPanel from "./components/MapPanel.jsx";
import OffscreenMap from "./components/OffscreenMap.jsx";
// ─────────────────────────────────────────────
// 📄 Page Routes
// ─────────────────────────────────────────────
import Home from "./pages/Home.jsx";
import Export from "./pages/Export.jsx";
import Analysis from "./pages/Analysis.jsx"

// ─────────────────────────────────────────────
// 🎨  Style Imports
// ─────────────────────────────────────────────
import "./styles/App.css";

// ─────────────────────────────────────────────
// 🗺 Tile Style Options (Leaflet + OpenStreetMap)
// ─────────────────────────────────────────────
const TILE_STYLES = {
  Standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  Terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
};

function App() {
  // ─────────────────────────────────────────────
  // 📊 Global State for Map + UI
  // ─────────────────────────────────────────────

  const[ isLoading, setIsLoading]=useState(true);
  const [mongoURI, setMongoURI] = useState(import.meta.env.VITE_DEFAULT_MONGO_URI);
  const [schemas, setSchemas] = useState([]);
  const [currentSchema, setCurrentSchema] = useState(null);
  const [currentCollection, setCurrentCollection] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tileStyle, setTileStyle] = useState("Standard");
  const [mapCenter, setMapCenter] = useState([43.4516, -80.4925]);
  const [mapZoom, setMapZoom] = useState(13);
  const [heatMap, setHeatMap] = useState([]);

  const BASE_URL = import.meta.env.VITE_API_URL;

   // 📡 Fetch all schemas and default markers on app load
 useEffect(() => {
  const loadSchemas = async () => {
    setIsLoading(true);
    const loadedSchemas = await fetchAllSchemas(mongoURI);
    setSchemas(loadedSchemas);

    if (loadedSchemas.length > 0) {
      setCurrentSchema(loadedSchemas[0]);
      setCurrentCollection(loadedSchemas[0].collectionName);
    }

    setIsLoading(false);
  };

  loadSchemas();
}, [mongoURI]);

  // 📡 Fetch markers when the current collection changes
  useEffect(() => {
  if (!currentCollection) return;

  const fetchMarkers = async () => {
    setIsLoading(true); 
    try {
      const res = await axios.get(`${BASE_URL}/api/locations`, {
        params: {
          collectionName: currentCollection,
          mongoURI
        },
      });
      setMarkers(res.data);
    } catch (err) {
      console.error("Failed to fetch markers:", err);
    } finally {
      setIsLoading(false); 
    }
  };

  fetchMarkers();
}, [currentCollection]);

  // ─────────────────────────────────────────────
  // ⚙️ App Structure & Routing
  // ─────────────────────────────────────────────
  //
  // App.jsx is the root of the application. It renders shared elements (like the header, map, and filter panel)
  // across all routes. This avoids reloading data or state between pages.
  //
  // For example:
  // - Switching between Home,Export, or Analysis keeps the same filtered markers.
  // - Shared components (e.g. MapPanel) remain mounted and responsive to updates.
  // - Only new route-specific panels (like modals, or option panels) get reloaded on navigation.
  //
  // This design improves performance and enables smooth workflow transitions.

 return (
  <div className="app-container">
    {/* Top Navigation Header */}
    <Header isLoading={isLoading}/>

    {/* Invisible map used for export snapshot */}
    <OffscreenMap
      tileUrl={TILE_STYLES[tileStyle]}
      filteredMarkers={filteredMarkers}
      center={mapCenter}
      zoom={mapZoom}
    />

    {/* Main UI Layer */}
    <div className="main-layer">
      {/* Filter Panel Toggle Button */}
      <button
        className={`filter-side-toggle filter-toggle ${showFilter ? "" : "collapsed-toggle"}`}
        onClick={() => setShowFilter(!showFilter)}
      >
        ☰
      </button>

      {/* Filter Panel */}
      <div className={`filter-overlay-panel filter-panel-wrapper ${showFilter ? "" : "collapsed"}`}>
        <FilterPanel
        mongoURI={mongoURI}
          schemas={schemas} 
          currentSchema={currentSchema} 
          setCurrentSchema={setCurrentSchema} 
          setCurrentCollection={setCurrentCollection} 
          tileStyle={tileStyle}
          setTileStyle={setTileStyle}
          markers={markers}
          setFilteredMarkers={setFilteredMarkers}
          setSelectedFilters={setSelectedFilters}
          setSelectedLocation={setSelectedLocation}
        />
      </div>

      {/* Map Display */}
      <MapPanel
        tileUrl={TILE_STYLES[tileStyle]}
        filteredMarkers={filteredMarkers}
        setSelectedLocation={setSelectedLocation}
        setMapCenter={setMapCenter}
        setMapZoom={setMapZoom}
        heatMap={heatMap}
        setHeatMap={setHeatMap}
      />

      {/* Page Routing */}
      <Routes>
        <Route path="/" element={<Home mongoURI={mongoURI} setMongoURI={setMongoURI} selectedLocation={selectedLocation} currentSchema={currentSchema} />} />
  
        <Route
          path="/export"
          element={
            <Export
              filteredMarkers={filteredMarkers}
              selectedLocation={selectedLocation}
              selectedFilters={selectedFilters}
            />
          }
        />
        <Route
          path="/analysis"
          element={
            <Analysis
              markers={markers}
              setHeatMap={setHeatMap}
              currentSchema={currentSchema}
              currentCollection={currentCollection}
            />
          }
        />
      </Routes>
    </div>
  </div>
);
}

export default App;



// ─────────────────────────────────────────────
// 🌐 REACT APP STRUCTURE & GLOBAL WORKFLOWS
// ─────────────────────────────────────────────

// ⬛ ROOT STRUCTURE (App.jsx)
// The root of the app stores global information needed every time the app starts.
// This includes:
// - Data that should persist between page changes (e.g. React Router navigation).
// - Shared state across components (e.g. filters, selected markers, base data).
// - Things that improve performance and user experience by avoiding unnecessary reloads.
//
// Keeping state here improves efficiency, modularity, and functional consistency across routes.

// ─────────────────────────────
// 📌 CLIENT-SIDE WORKFLOWS
// ─────────────────────────────

// ── 🧭 VIEWING CONTROLS WORKFLOW (Home Page) ──
// Purpose: To help users discover *free resources* and *public services*—not just commercial businesses.
// Useful for people who don’t know what keywords to search on Google (e.g., “free water”, “shower”, “outdoor washroom”).

// Why it’s different from Google Maps:
// 1. No search bar needed — users can filter by needs, not names.
// 2. All displayed data is curated — not based on ads, SEO, or user popularity.
// 3. Could be used as:
//    ✅ a public utility for social good
//    💰 or monetized (e.g., sponsored listings).

// Advanced extensions:
// - Highlight resource density (e.g. green = many resources, red = none).
// - Visualize social or physical risk (hostile zones, accessibility deserts).
// - Add route analysis (safe corridors, transit access, bike/walk paths).

// Filtering precision comes from the data model:
// - You can add new labels and filters to highlight seasonal or time-based differences.
//   For example: “Free meals every Tuesday at 6 PM” could be added as an exception dataset.

// ⚠️ Current logic assumes resources are *always* available when a location is open.
//   But this is not the same as tracking:
//   “Location open” at time T ⧸= “Resource available” at time T.

// ▶ Input → Database (marker data)
// ▶ Input → FilterPanel.jsx (user filters)
// ▶ Output → MapPanel.jsx (filtered markers on map)

// ── 📄 EXPORT WORKFLOW (Export Page) ──
// Purpose: Share map data with others — especially those without digital access or with accessibility needs.

// Use cases:
// - Send a PDF map to someone who doesn’t use computers
// - Print a version for outreach work or emergencies
// - Customize what’s shown before printing

// Integration with viewing controls:
// - Export uses the same filter panel as the map view
// - A hidden map instance (OffscreenMap.jsx) renders in the background to create clean, printable images
// - Once filtered, user can export a ready-to-use PDF

// ▶ Input → Database (filtered markers from base data)
// ▶ Input → FilterPanel.jsx (controls applied to dataset)
// ▶ Input → ExportOptions.jsx (custom export settings)
// ▶ Output → OffscreenMap.jsx (snapshot layer)
// ▶ Output → ExportPreviewModal.jsx (PDF preview/export)

// ── 📊 ANALYSIS WORKFLOW (Analysis Page) ──
// Purpose: View and update score-based overlays used in resource analysis and planning.

// Core features:
// - Heatmaps and service zones reflect score data from the database
// - Filter-based overlays (e.g. combinations of resources, services, or amenities)
// - Visual output updates based on filters.

// This page is read-only in the client version:
// - Users cannot submit scores or edit data
// - Score values are pre-calculated and stored with the location data
// - Limited Options for analysis (uses preset values for decay or buffer radius)

// ▶ Input → Database (pre-existing score data)
// ▶ Input → AnalysisOptions.jsx (filters and analysis type)
// ▶ Shared Output → MapPanel.jsx
// ▶ Output → HeatMapLayer.jsx (overlay visualization)

// ─────────────────────────────
// 🔁 STREAM FLOW SUMMARIES
// ─────────────────────────────

// Viewing Controls Workflow:
// Input → Database → FilterPanel.jsx → MapPanel.jsx → Output (visible markers)

// Export Workflow:
// Input → Database → FilterPanel.jsx → ExportOptions.jsx → OffscreenMap.jsx → ExportPreviewModal.jsx → PDF

// Analysis Workflow:
// Input → Database → AnalysisOptions.jsx → MapPanel.jsx → HeatMapLayer.jsx → Output
