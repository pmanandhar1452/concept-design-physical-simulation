import React, { useState } from "react";
import OrbitEngine from "./views/OrbitEngine";
import ModalAnalysis from "./views/ModalAnalysis";
import OpenSCADModalAnalysis from "./views/OpenSCADModalAnalysis";
import "./index.css";

function App() {
  const [selectedPhysics, setSelectedPhysics] = useState("orbital_mechanics");

  const handlePhysicsChange = (physicsType) => {
    setSelectedPhysics(physicsType);
  };

  return (
    <div className="App">
      {selectedPhysics === "orbital_mechanics" ? (
        <OrbitEngine onPhysicsChange={handlePhysicsChange} />
      ) : selectedPhysics === "modal_analysis" ? (
        <ModalAnalysis onPhysicsChange={handlePhysicsChange} />
      ) : selectedPhysics === "openscad_modal_analysis" ? (
        <OpenSCADModalAnalysis onPhysicsChange={handlePhysicsChange} />
      ) : (
        <OrbitEngine onPhysicsChange={handlePhysicsChange} />
      )}
    </div>
  );
}

export default App;
