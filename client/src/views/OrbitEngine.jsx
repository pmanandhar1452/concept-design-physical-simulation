import React, { useState, useEffect, useRef } from 'react';
import SolarSystem from '../components/SolarSystem';
import TrajectoryPlanner from '../components/TrajectoryPlanner';
import { 
  TimeControls, 
  BodyInfoPanel, 
  MissionPanel, 
  SimulationInfo 
} from '../components/ControlPanel';

export default function OrbitEngine() {
  // State management
  const [simulationState, setSimulationState] = useState({
    timestamp: 0,
    real_timestamp: new Date().toISOString(),
    bodies: {},
    missions: [],
    time_scale: 1,
    is_playing: false
  });
  
  const [selectedBody, setSelectedBody] = useState(null);
  const [bodyInfo, setBodyInfo] = useState(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef(null);
  
  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws/engine');
    
    ws.onopen = () => {
      console.log('Connected to Orbit Engine');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'state_update') {
          setSimulationState(message.data);
        } else if (message.type === 'body_info') {
          setBodyInfo(message.data);
        } else if (message.type === 'status') {
          console.log('Status:', message.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from Orbit Engine');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
    
    wsRef.current = ws;
  };
  
  // Send WebSocket command
  const sendCommand = (command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  };
  
  // Control handlers
  const handlePlayPause = () => {
    const action = simulationState.is_playing ? 'pause' : 'play';
    sendCommand({ type: 'control', action });
    
    // Also send via REST API for redundancy
    fetch('http://localhost:8000/api/control/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
  };
  
  const handleSpeedChange = (speed) => {
    sendCommand({ type: 'control', action: 'set_speed', speed });
    
    // Also send via REST API
    fetch('http://localhost:8000/api/control/time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_speed', speed })
    });
  };
  
  const handleBodyClick = async (bodyName) => {
    setSelectedBody(bodyName.toLowerCase());
    
    // Request body info via WebSocket
    sendCommand({ type: 'focus', body_name: bodyName });
    
    // Also fetch via REST API
    try {
      const response = await fetch('http://localhost:8000/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_name: bodyName })
      });
      
      if (response.ok) {
        const info = await response.json();
        setBodyInfo(info);
      }
    } catch (error) {
      console.error('Error fetching body info:', error);
    }
  };
  
  const handleLaunchMission = (mission) => {
    console.log('Mission launched:', mission);
    // Mission will be added to state via WebSocket updates
  };
  
  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-2xl font-bold">Orbit Engine</h1>
            <span className={`px-2 py-1 rounded text-xs ${
              isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={() => setShowPlanner(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Plan Mission
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* 3D View */}
        <div className="flex-1 relative">
          <SolarSystem
            bodies={simulationState.bodies}
            missions={simulationState.missions}
            onBodyClick={handleBodyClick}
            selectedBody={selectedBody}
            timeScale={simulationState.time_scale}
          />
          
          {/* Overlaid simulation info */}
          <div className="absolute top-4 left-4">
            <SimulationInfo
              timestamp={simulationState.timestamp}
              realTime={simulationState.real_timestamp}
            />
          </div>
        </div>
        
        {/* Side panel */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 p-4 space-y-4 overflow-y-auto">
          <TimeControls
            isPlaying={simulationState.is_playing}
            timeScale={simulationState.time_scale}
            onPlayPause={handlePlayPause}
            onSpeedChange={handleSpeedChange}
          />
          
          {bodyInfo && (
            <BodyInfoPanel
              body={bodyInfo}
              onClose={() => {
                setBodyInfo(null);
                setSelectedBody(null);
              }}
            />
          )}
          
          <MissionPanel missions={simulationState.missions} />
        </div>
      </div>
      
      {/* Trajectory Planner Modal */}
      <TrajectoryPlanner
        isOpen={showPlanner}
        onClose={() => setShowPlanner(false)}
        onLaunchMission={handleLaunchMission}
      />
    </div>
  );
}
