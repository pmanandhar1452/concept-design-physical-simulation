import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import OpenSCADEditor from "../components/OpenSCADEditor";
import ModalControls from "../components/ModalControls";
import { PhysicsPanel } from "../components/PhysicsPanel";

const OpenSCADModalAnalysis = ({ onPhysicsChange }) => {
  const [selectedTab, setSelectedTab] = useState("editor"); // 'editor', 'simulation', 'results'
  const [oscadGeometry, setOscadGeometry] = useState(null);
  const [modalResults, setModalResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentMode, setCurrentMode] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [animationPhase, setAnimationPhase] = useState(0);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "modal_analysis_update") {
        setModalResults(data.results);
        setIsCalculating(false);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleGeometryChange = (geometry) => {
    setOscadGeometry(geometry);
  };

  const handleStartSimulation = async () => {
    if (!oscadGeometry) {
      alert("Please design a geometry in the OpenSCAD editor first");
      return;
    }

    setIsCalculating(true);

    try {
      // Extract parameters from the OpenSCAD geometry
      const params = extractParametersFromGeometry(oscadGeometry);

      const response = await fetch(
        "http://localhost:8000/api/modal/tuning-fork",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "oscad_design",
            ...params,
            material: "steel",
            mesh_resolution: 8,
            num_modes: 5,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setModalResults(result);
        setSelectedTab("results");
      } else {
        throw new Error("Failed to start simulation");
      }
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Failed to start simulation: " + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const extractParametersFromGeometry = (geometry) => {
    // Extract dimensions from the OpenSCAD geometry
    // This is a simplified extraction - in a real implementation,
    // you'd parse the OpenSCAD code more thoroughly

    // Default parameters
    const params = {
      length: 120,
      width: 20,
      thickness: 5,
      handle_length: 40,
      handle_width: 15,
    };

    // Try to extract from geometry bounds
    if (geometry) {
      const box = new THREE.Box3().setFromObject(geometry);
      const size = box.getSize(new THREE.Vector3());

      params.length = Math.max(size.x, size.y) * 1000; // Convert to mm
      params.width = Math.min(size.x, size.y) * 1000;
      params.handle_length = size.x * 1000 * 0.3; // Estimate handle length
      params.handle_width = size.z * 1000;
    }

    return params;
  };

  const handleResimulate = () => {
    setSelectedTab("editor");
    setModalResults(null);
  };

  // Animation effect
  useEffect(() => {
    if (!isPlaying || !modalResults) return;

    const interval = setInterval(() => {
      setAnimationPhase(
        (prev) => (prev + 0.1 * animationSpeed) % (2 * Math.PI)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, animationSpeed, modalResults]);

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Side Panel */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
        <PhysicsPanel
          selectedPhysics="openscad_modal_analysis"
          onPhysicsChange={onPhysicsChange}
        />

        {/* Tab Navigation */}
        <div className="mt-6">
          <div className="flex space-x-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setSelectedTab("editor")}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                selectedTab === "editor"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Design
            </button>
            <button
              onClick={() => setSelectedTab("simulation")}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                selectedTab === "simulation"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Simulate
            </button>
            <button
              onClick={() => setSelectedTab("results")}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                selectedTab === "results"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Results
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {selectedTab === "editor" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">OpenSCAD Design</h3>
              <p className="text-gray-400 text-sm mb-4">
                Design your tuning fork geometry using OpenSCAD code. The
                preview will update in real-time.
              </p>
              <button
                onClick={() => setSelectedTab("simulation")}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                Continue to Simulation
              </button>
            </div>
          )}

          {selectedTab === "simulation" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Simulation Setup</h3>
              <p className="text-gray-400 text-sm mb-4">
                Configure simulation parameters and start the modal analysis.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Material
                  </label>
                  <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                    <option value="steel">Steel</option>
                    <option value="aluminum">Aluminum</option>
                    <option value="brass">Brass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Modes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mesh Resolution
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="16"
                    defaultValue="8"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  />
                </div>
              </div>

              <button
                onClick={handleStartSimulation}
                disabled={isCalculating || !oscadGeometry}
                className={`w-full py-2 px-4 rounded transition-colors mt-4 ${
                  isCalculating || !oscadGeometry
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isCalculating ? "Calculating..." : "Start Simulation"}
              </button>
            </div>
          )}

          {selectedTab === "results" && modalResults && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Modal Analysis Results
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-300">Analysis ID</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {modalResults.analysis_id}
                  </p>
                </div>

                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-300">Number of Modes</p>
                  <p className="text-lg font-semibold">
                    {modalResults.num_modes}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Modal Frequencies:</p>
                  {modalResults.modes?.map((mode, index) => (
                    <div key={index} className="bg-gray-700 p-2 rounded">
                      <p className="text-xs text-gray-400">
                        Mode {mode.mode_number}
                      </p>
                      <p className="text-sm font-semibold">
                        {mode.frequency.toFixed(1)} Hz
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleResimulate}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors mt-4"
              >
                Design New Geometry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">OpenSCAD Modal Analysis</h1>
            <div className="flex space-x-2">
              {selectedTab === "results" && modalResults && (
                <ModalControls
                  currentMode={currentMode}
                  setCurrentMode={setCurrentMode}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  animationSpeed={animationSpeed}
                  setAnimationSpeed={setAnimationSpeed}
                  numModes={modalResults.num_modes || 0}
                />
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {selectedTab === "editor" && (
            <OpenSCADEditor onGeometryChange={handleGeometryChange} />
          )}

          {(selectedTab === "simulation" || selectedTab === "results") && (
            <div className="h-full p-4">
              <div className="h-full bg-gray-800 rounded">
                <Canvas
                  style={{
                    background:
                      "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                  }}
                >
                  <PerspectiveCamera makeDefault position={[0, 0, 200]} />
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={50}
                    maxDistance={500}
                  />

                  {/* Lighting */}
                  <ambientLight intensity={0.6} />
                  <directionalLight
                    position={[10, 10, 5]}
                    intensity={1.2}
                    color="#ffffff"
                  />
                  <directionalLight
                    position={[-10, -10, 5]}
                    intensity={0.8}
                    color="#ffffff"
                  />
                  <pointLight
                    position={[0, 0, 10]}
                    intensity={0.6}
                    color="#ffffff"
                  />

                  {/* Render geometry with modal animation */}
                  {oscadGeometry && (
                    <primitive
                      object={oscadGeometry.clone()}
                      scale={[0.1, 0.1, 0.1]} // Scale down for better view
                    />
                  )}

                  {/* Grid for reference */}
                  <gridHelper args={[100, 20, 0x444444, 0x222222]} />
                </Canvas>
              </div>

              {selectedTab === "simulation" && isCalculating && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <p className="text-white">
                        Calculating modal frequencies...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenSCADModalAnalysis;
