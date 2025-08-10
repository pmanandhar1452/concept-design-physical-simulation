import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import TuningForkModel from "../components/TuningForkModel";
import ModalControls from "../components/ModalControls";
import TuningForkParameters from "../components/TuningForkParameters";
import { PhysicsPanel } from "../components/PhysicsPanel";
import { useWebSocket } from "../hooks/useWebSocket";

export default function ModalAnalysis({ onPhysicsChange }) {
  const [selectedPhysics, setSelectedPhysics] = useState("modal_analysis");
  const [tuningForkData, setTuningForkData] = useState(null);
  const [modalResults, setModalResults] = useState(null);
  const [currentMode, setCurrentMode] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showParameters, setShowParameters] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);

  const wsRef = useRef(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/engine");

    ws.onopen = () => {
      console.log("Connected to Modal Analysis WebSocket");
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "modal_update") {
          setModalResults(message.data);
        } else if (message.type === "calculation_progress") {
          setCalculationProgress(message.progress);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from Modal Analysis WebSocket");
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      }, 3000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 0.05 * timeScale) % (2 * Math.PI));
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, timeScale]);

  const handleStartSimulation = async (parameters) => {
    setIsCalculating(true);
    setCalculationProgress(0);

    try {
      const response = await fetch(
        "http://localhost:8000/api/modal/tuning-fork",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parameters),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setModalResults(result);
        setTuningForkData(parameters);
        setCurrentMode(1);
        setIsCalculating(false);
        setCalculationProgress(1);
      } else {
        throw new Error("Failed to start simulation");
      }
    } catch (error) {
      console.error("Error starting simulation:", error);
      setIsCalculating(false);
      setCalculationProgress(0);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed) => {
    setTimeScale(speed);
  };

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
  };

  const handlePhysicsChange = (physicsType) => {
    setSelectedPhysics(physicsType);
    if (onPhysicsChange) {
      onPhysicsChange(physicsType);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full px-4 py-2 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 gap-4">
            <h1 className="text-white text-2xl font-bold">Modal Analysis</h1>
            <span className="px-2 py-1 rounded text-xs bg-blue-600 text-white">
              {selectedPhysics === "modal_analysis"
                ? "Modal Analysis"
                : "Orbital Mechanics"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowParameters(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              {modalResults ? "Resimulate" : "Start Simulation"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* 3D View */}
        <div className="fixed top-0 left-0 w-full h-full">
          <Canvas
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
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
            <pointLight position={[0, 0, 10]} intensity={0.6} color="#ffffff" />

            {/* Tuning Fork Model */}
            <TuningForkModel
              tuningForkData={tuningForkData}
              modalResults={modalResults}
              currentMode={currentMode}
              animationPhase={animationPhase}
              isCalculating={isCalculating}
            />
          </Canvas>

          {/* Overlaid controls */}
          <div className="fixed top-20 left-4">
            <ModalControls
              isPlaying={isPlaying}
              timeScale={timeScale}
              currentMode={currentMode}
              modalResults={modalResults}
              onPlayPause={handlePlayPause}
              onSpeedChange={handleSpeedChange}
              onModeChange={handleModeChange}
            />
          </div>

          {/* Calculation progress */}
          {isCalculating && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-6 rounded-lg z-50">
              <div className="text-white text-center">
                <h3 className="text-lg mb-4">Calculating Modal Analysis...</h3>
                <div className="w-64 bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculationProgress * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-300">
                  {Math.round(calculationProgress * 100)}% Complete
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="fixed top-20 right-0 w-96 bg-transparent p-4 space-y-4 overflow-y-auto max-h-screen">
          <PhysicsPanel
            selectedPhysics={selectedPhysics}
            onPhysicsChange={handlePhysicsChange}
          />

          {modalResults && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white text-lg mb-3">Modal Results</h3>
              <div className="space-y-2">
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Analysis ID:</span>
                  <div className="text-white font-mono text-xs">
                    {modalResults.analysis_id}
                  </div>
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Modes Calculated:</span>
                  <div className="text-white">{modalResults.num_modes}</div>
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-gray-500">Current Mode:</span>
                  <div className="text-white">{currentMode}</div>
                </div>
                {modalResults.modes && modalResults.modes[currentMode - 1] && (
                  <div className="text-gray-300 text-sm">
                    <span className="text-gray-500">Frequency:</span>
                    <div className="text-white">
                      {modalResults.modes[currentMode - 1].frequency.toFixed(2)}{" "}
                      Hz
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tuningForkData && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white text-lg mb-3">
                Tuning Fork Properties
              </h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <div>
                  <span className="text-gray-500">Material:</span>
                  <div className="text-white">{tuningForkData.material}</div>
                </div>
                <div>
                  <span className="text-gray-500">Length:</span>
                  <div className="text-white">
                    {tuningForkData.length * 1000} mm
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Prong Diameter:</span>
                  <div className="text-white">
                    {tuningForkData.width * 1000} mm
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Thickness:</span>
                  <div className="text-white">
                    {tuningForkData.thickness * 1000} mm
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parameters Modal */}
      {showParameters && (
        <TuningForkParameters
          isOpen={showParameters}
          onClose={() => setShowParameters(false)}
          onStartSimulation={handleStartSimulation}
          existingData={tuningForkData}
        />
      )}
    </div>
  );
}
