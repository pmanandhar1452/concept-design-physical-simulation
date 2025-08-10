import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import TuningForkModel from "./TuningForkModel";

export default function TuningForkParameters({
  isOpen,
  onClose,
  onStartSimulation,
  existingData,
}) {
  const [parameters, setParameters] = useState({
    name: "Tuning Fork",
    length: 0.1,
    width: 0.02,
    thickness: 0.005,
    handle_length: 0.03,
    handle_width: 0.01,
    material: "steel",
    mesh_resolution: 10,
    num_modes: 5,
  });

  const materials = [
    { value: "steel", label: "Steel", density: 7850, youngs_modulus: 200e9 },
    {
      value: "aluminum",
      label: "Aluminum",
      density: 2700,
      youngs_modulus: 70e9,
    },
    { value: "brass", label: "Brass", density: 8500, youngs_modulus: 110e9 },
    {
      value: "titanium",
      label: "Titanium",
      density: 4500,
      youngs_modulus: 116e9,
    },
  ];

  // Initialize with existing data if available
  useEffect(() => {
    if (existingData) {
      setParameters(existingData);
    }
  }, [existingData]);

  const handleParameterChange = (field, value) => {
    setParameters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartSimulation(parameters);
    onClose();
  };

  const selectedMaterial = materials.find(
    (m) => m.value === parameters.material
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-2xl font-bold">
            Tuning Fork Parameters
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parameters Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={parameters.name}
                  onChange={(e) =>
                    handleParameterChange("name", e.target.value)
                  }
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold">
                  Dimensions (meters) - U-Shaped Design
                </h3>
                <p className="text-gray-400 text-sm">
                  The tuning fork features a U-shaped design with curved
                  transitions from handle to prongs.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm">Length</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.01"
                      max="1.0"
                      value={parameters.length}
                      onChange={(e) =>
                        handleParameterChange(
                          "length",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm">Prong Diameter</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="0.1"
                      value={parameters.width}
                      onChange={(e) =>
                        handleParameterChange(
                          "width",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm">Thickness</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      max="0.01"
                      value={parameters.thickness}
                      onChange={(e) =>
                        handleParameterChange(
                          "thickness",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm">Handle Length</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.01"
                      max="0.1"
                      value={parameters.handle_length}
                      onChange={(e) =>
                        handleParameterChange(
                          "handle_length",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm">
                      Handle Diameter
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="0.05"
                      value={parameters.handle_width}
                      onChange={(e) =>
                        handleParameterChange(
                          "handle_width",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Material Properties */}
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold">
                  Material Properties
                </h3>

                <div>
                  <label className="text-white text-sm">Material</label>
                  <select
                    value={parameters.material}
                    onChange={(e) =>
                      handleParameterChange("material", e.target.value)
                    }
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  >
                    {materials.map((material) => (
                      <option key={material.value} value={material.value}>
                        {material.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMaterial && (
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>
                        Density: {selectedMaterial.density.toLocaleString()}{" "}
                        kg/m³
                      </div>
                      <div>
                        Young's Modulus:{" "}
                        {(selectedMaterial.youngs_modulus / 1e9).toFixed(0)} GPa
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Settings */}
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold">
                  Analysis Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm">
                      Mesh Resolution
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={parameters.mesh_resolution}
                      onChange={(e) =>
                        handleParameterChange(
                          "mesh_resolution",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm">
                      Number of Modes
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={parameters.num_modes}
                      onChange={(e) =>
                        handleParameterChange(
                          "num_modes",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-semibold transition-colors"
                >
                  Start Simulation
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* 3D Preview */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">3D Preview</h3>
            <div className="h-96 bg-gray-900 rounded">
              <Canvas
                style={{
                  background:
                    "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
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
                <pointLight
                  position={[0, 0, 10]}
                  intensity={0.6}
                  color="#ffffff"
                />

                {/* Tuning Fork Preview */}
                <TuningForkModel
                  tuningForkData={parameters}
                  modalResults={null}
                  currentMode={1}
                  animationPhase={0}
                  isCalculating={false}
                />
              </Canvas>
            </div>

            <div className="text-gray-400 text-sm">
              <p>• Drag to rotate • Scroll to zoom • Right-click to pan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
