import React, { useState } from "react";
import AnalysisOptions from "../components/AnalysisOptions.jsx";
import "./Analysis.css";

function Analysis({
  markers,
  setHeatMap,
}) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      {/* Analysis Options Panel Toggle + Panel */}
      <button
        className={`options-side-toggle options-toggle ${
          showOptions? "" : "collapsed-toggle"
        }`}
        onClick={() => setShowOptions(!showOptions)}
      >
        ☰
      </button>
      <div
        className={`options-overlay-panel options-panel-wrapper ${
          showOptions ? "" : "collapsed"
        }`}
      >
        <AnalysisOptions markers={markers} setHeatMap={setHeatMap} />
      </div>
    </>
  );
}

export default Analysis;
