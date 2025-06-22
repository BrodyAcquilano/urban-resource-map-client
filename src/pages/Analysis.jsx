import React, { useState } from "react";
import AnalysisOptions from "../components/AnalysisOptions.jsx";
import '../styles/pages.css';

function Analysis({
  markers,
  setHeatMap,
}) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      {/* Analysis Options Panel Toggle + Panel */}
      <button
        className={`side-toggle toggle ${
          showOptions? "" : "collapsed-toggle"
        }`}
        onClick={() => setShowOptions(!showOptions)}
      >
        ☰
      </button>
      <div
        className={`overlay-panel panel-wrapper ${
          showOptions ? "" : "collapsed"
        }`}
      >
        <AnalysisOptions markers={markers} setHeatMap={setHeatMap} />
      </div>
    </>
  );
}

export default Analysis;
