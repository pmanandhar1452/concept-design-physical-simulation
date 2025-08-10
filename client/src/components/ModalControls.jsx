import React from "react";

export default function ModalControls({
  isPlaying,
  timeScale,
  currentMode,
  modalResults,
  onPlayPause,
  onSpeedChange,
  onModeChange,
}) {
  const speedOptions = [
    { value: 0.5, label: "0.5x" },
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 5, label: "5x" },
    { value: 10, label: "10x" },
  ];

  const maxModes = modalResults?.num_modes || 1;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-white text-lg mb-3">Animation Controls</h3>

      <div className="space-y-4">
        {/* Play/Pause Control */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onPlayPause}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              isPlaying
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          <div className="flex items-center space-x-2">
            <label className="text-gray-300">Speed:</label>
            <select
              value={timeScale}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
            >
              {speedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Selection */}
        {modalResults && (
          <div className="space-y-2">
            <label className="text-gray-300 text-sm">Mode:</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onModeChange(Math.max(1, currentMode - 1))}
                disabled={currentMode <= 1}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ◀
              </button>

              <span className="text-white font-mono min-w-[3rem] text-center">
                {currentMode}
              </span>

              <button
                onClick={() =>
                  onModeChange(Math.min(maxModes, currentMode + 1))
                }
                disabled={currentMode >= maxModes}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶
              </button>

              <span className="text-gray-400 text-sm">of {maxModes}</span>
            </div>

            {/* Mode Frequency Display */}
            {modalResults.modes && modalResults.modes[currentMode - 1] && (
              <div className="text-gray-300 text-sm">
                <span className="text-gray-500">Frequency:</span>
                <div className="text-white font-mono">
                  {modalResults.modes[currentMode - 1].frequency.toFixed(2)} Hz
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode Type Description */}
        {modalResults && (
          <div className="text-gray-400 text-xs">
            {currentMode === 1 && "Fundamental bending mode"}
            {currentMode === 2 && "Second bending mode"}
            {currentMode === 3 && "Torsional mode"}
            {currentMode > 3 && `Higher order mode ${currentMode}`}
          </div>
        )}

        {/* Current Speed Display */}
        <div className="text-gray-400 text-sm">Current Speed: {timeScale}x</div>
      </div>
    </div>
  );
}
