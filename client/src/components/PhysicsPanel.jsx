import React from "react";

export function PhysicsPanel({ selectedPhysics, onPhysicsChange }) {
  const physicsOptions = [
    {
      id: "orbital_mechanics",
      name: "Orbital Mechanics",
      description:
        "Simulate celestial bodies and spacecraft using gravitational physics",
      icon: "🌌",
      features: [
        "Gravitational forces between bodies",
        "Orbital trajectories and transfers",
        "Hohmann transfer calculations",
        "Real-time celestial mechanics",
      ],
    },
    {
      id: "modal_analysis",
      name: "Modal Analysis",
      description:
        "Finite element simulation for structural vibration analysis",
      icon: "🎵",
      features: [
        "U-shaped tuning fork modeling",
        "Finite element mesh generation",
        "Modal frequency calculation",
        "Real-time mode shape animation",
      ],
    },
    {
      id: "openscad_modal_analysis",
      name: "OpenSCAD Modal Analysis",
      description:
        "Design tuning fork geometry with OpenSCAD and perform modal analysis",
      icon: "⚙️",
      features: [
        "OpenSCAD code editor",
        "Real-time 3D preview",
        "Parametric geometry design",
        "Modal analysis integration",
      ],
    },
    // Future physics types can be added here:
    // {
    //   id: 'fluid_dynamics',
    //   name: 'Fluid Dynamics',
    //   description: 'Simulate fluid flow and hydrodynamic effects',
    //   icon: '🌊',
    //   features: [
    //     'Navier-Stokes equations',
    //     'Turbulent flow simulation',
    //     'Boundary layer effects'
    //   ]
    // },
    // {
    //   id: 'particle_systems',
    //   name: 'Particle Systems',
    //   description: 'Simulate particle interactions and dynamics',
    //   icon: '✨',
    //   features: [
    //     'Particle collision detection',
    //     'Force field interactions',
    //     'Statistical mechanics'
    //   ]
    // }
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white text-lg mb-3">Physics Engine</h3>

      <div className="space-y-3">
        {physicsOptions.map((physics) => (
          <div
            key={physics.id}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPhysics === physics.id
                ? "border-blue-500 bg-blue-900/20"
                : "border-gray-600 bg-gray-700 hover:border-gray-500"
            }`}
            onClick={() => onPhysicsChange(physics.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{physics.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">{physics.name}</h4>
                  {selectedPhysics === physics.id && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  {physics.description}
                </p>

                {selectedPhysics === physics.id && (
                  <div className="mt-3">
                    <h5 className="text-blue-400 text-sm font-medium mb-2">
                      Features:
                    </h5>
                    <ul className="space-y-1">
                      {physics.features.map((feature, index) => (
                        <li
                          key={index}
                          className="text-gray-300 text-xs flex items-center"
                        >
                          <span className="text-blue-400 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {physicsOptions.length === 1 && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <div className="text-gray-300 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⚠</span>
              <span>More physics engines coming soon!</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              We're working on adding fluid dynamics, particle systems, and more
              physics simulations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
