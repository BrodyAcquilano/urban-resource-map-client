import React, { useState } from "react";
import * as turf from "@turf/turf";
import "../styles/panels.css";

function AnalysisOptions({ markers, setHeatMap, currentSchema }) {
  const categories = currentSchema?.categories || [];
  const categoryNames = categories.map((cat) => cat.categoryName);

  // State for Proximity Influence Zones
  const [proximityBufferRadius] = useState(5000);
  const [proximityResolution] = useState(100);
  const [proximityDecay] = useState("fast");

  // State for Cumulative Resource Influence
  const [cumulativeBufferRadius] = useState(5000);
  const [cumulativeResolution] = useState(100);
  const [cumulativeCategoryType, setCumulativeCategoryType] = useState("all");
  const [cumulativeMinPercentile] = useState(0);
  const [cumulativeMaxPercentile] = useState(100);
  const [cumulativeDecayPower] = useState(5);

  const normalize = (value, min, max) =>
    max !== min ? (value - min) / (max - min) : 1;

  const calculateScore = (scores = {}, flags = {}) => {
    const values = Object.entries(flags)
      .filter(([key, enabled]) => enabled)
      .map(([key]) => scores[key] ?? 0);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  function interpolateColor(value) {
    value = Math.max(0, Math.min(1, value));
    const hue = value * 120;
    return `hsl(${hue}, 100%, 50%)`;
  }

  const getPercentile = (arr, percentile) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
  };

  const cumulativeGetScore = (marker) => {
    let types = [];

    if (cumulativeCategoryType === "all") {
      types = categoryNames;
    } else if (cumulativeCategoryType.includes("_")) {
      types = cumulativeCategoryType.split("_");
    } else {
      types = [cumulativeCategoryType];
    }

    const allScores = types.map((type) =>
      calculateScore(marker.scores?.[type], marker.categories?.[type])
    );

    return allScores.reduce((a, b) => a + b, 0) / allScores.length;
  };

  const handleGenerateProximity = () => {
    const allPoints = markers.map((m) =>
      turf.point([parseFloat(m.longitude), parseFloat(m.latitude)], { marker: m })
    );

    const bbox = turf.bbox(turf.featureCollection(allPoints));
    let [minLng, minLat, maxLng, maxLat] = bbox;

    const expandLng = (maxLng - minLng) * 0.1;
    const expandLat = (maxLat - minLat) * 0.1;
    minLng -= expandLng;
    maxLng += expandLng;
    minLat -= expandLat;
    maxLat += expandLat;

    const cols = proximityResolution;
    const rows = proximityResolution;
    const latStep = (maxLat - minLat) / rows;
    const lngStep = (maxLng - minLng) / cols;
    const pixels = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lat = maxLat - y * latStep;
        const lng = minLng + x * lngStep;
        const pixelPoint = turf.point([lng, lat]);

        let totalInfluence = 0;
        let totalWeight = 0;

        for (const m of markers) {
          const dist = turf.distance(
            pixelPoint,
            turf.point([parseFloat(m.longitude), parseFloat(m.latitude)]),
            { units: "kilometers" }
          );

          const distance = dist * 1000;
          if (distance > proximityBufferRadius) continue;

          let proximityInfluence = 0;
          const decayFactor = 1 - distance / proximityBufferRadius;

          if (proximityDecay === "slow") {
            proximityInfluence = Math.sqrt(decayFactor);
          } else if (proximityDecay === "fast") {
            proximityInfluence = decayFactor;
          }

          if (proximityInfluence > 0) {
            totalInfluence += proximityInfluence;
            totalWeight += 1;
          }
        }

        const normalized = totalWeight > 0 ? totalInfluence / totalWeight : 0;
        const color = interpolateColor(normalized);

        pixels.push({ x, y, value: normalized, color });
      }
    }

    setHeatMap({
      pixels,
      bounds: [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
    });
  };

  const handleGenerateCumulative = () => {
    const scoredMarkers = markers.map((m) => ({
      ...m,
      score: cumulativeGetScore(m),
    }));
    const scores = scoredMarkers.map((m) => m.score);

    const min = getPercentile(scores, cumulativeMinPercentile);
    const max = getPercentile(scores, cumulativeMaxPercentile);

    const normalizedMarkers = scoredMarkers.map((m) => ({
      ...m,
      normalized: normalize(m.score, min, max),
    }));

    const allPoints = normalizedMarkers.map((m) =>
      turf.point([parseFloat(m.longitude), parseFloat(m.latitude)])
    );
    const bbox = turf.bbox(turf.featureCollection(allPoints));
    let [minLng, minLat, maxLng, maxLat] = bbox;

    const expandLng = (maxLng - minLng) * 0.1;
    const expandLat = (maxLat - minLat) * 0.1;
    minLng -= expandLng;
    maxLng += expandLng;
    minLat -= expandLat;
    maxLat += expandLat;

    const cols = cumulativeResolution;
    const rows = cumulativeResolution;
    const latStep = (maxLat - minLat) / rows;
    const lngStep = (maxLng - minLng) / cols;
    const pixels = [];

    let maxPixelValue = 0;
    const decayPower = cumulativeDecayPower;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lat = maxLat - y * latStep;
        const lng = minLng + x * lngStep;
        const pixelPoint = turf.point([lng, lat]);

        let cumulativeValue = 0;

        for (const m of normalizedMarkers) {
          const dist = turf.distance(
            pixelPoint,
            turf.point([parseFloat(m.longitude), parseFloat(m.latitude)]),
            { units: "kilometers" }
          );
          const meters = dist * 1000;

          if (meters <= cumulativeBufferRadius) {
            const decay = 1 - meters / cumulativeBufferRadius;
            const adjusted = decay ** decayPower;
            cumulativeValue += m.normalized * adjusted;
          }
        }

        maxPixelValue = Math.max(maxPixelValue, cumulativeValue);
        pixels.push({
          x,
          y,
          value: cumulativeValue,
          color: interpolateColor(cumulativeValue / maxPixelValue),
        });
      }
    }

    setHeatMap({
      pixels,
      bounds: [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
    });
  };

  return (
    <div className="panel">
      <div className="section">
        <h2>Analysis Options</h2>
      </div>

      <div className="section">
        <h3>Proximity Influence Zones</h3>
        <p className="tooltip">
          Measures closeness. Clusters of nearby locations are a good indicator of high resource zones.
        </p>

        <div className="buttons-container">
          <button onClick={handleGenerateProximity}>Generate</button>
          <button onClick={() => setHeatMap(null)}>Clear</button>
        </div>
      </div>

      <div className="section">
        <h3>Cumulative Resource Influence</h3>
        <p className="tooltip">
          Highlights the added value of sharing resources and overlapping areas.
        </p>

        <div className="form-group">
          <label>Category Type:</label>
          <select
            value={cumulativeCategoryType}
            onChange={(e) => setCumulativeCategoryType(e.target.value)}
          >
            <option value="all">All</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="buttons-container">
          <button onClick={handleGenerateCumulative}>Generate</button>
          <button onClick={() => setHeatMap(null)}>Clear</button>
        </div>
      </div>

      <div className="section">
        <h3>Color Legend:</h3>
        <ul>
          <li><span></span> 🟢 = Well-Served / High Resource Zone</li>
          <li><span></span> 🟡 = Moderately Served / Stable but Limited</li>
          <li><span></span> 🟠 = Under-Served / Needs Attention</li>
          <li><span></span> 🔴 = Critical Shortage / Resource Desert</li>
        </ul>
      </div>
    </div>
  );
}

export default AnalysisOptions;
