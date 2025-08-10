# Modal Analysis - Tuning Fork Finite Element Simulation

A complete modal analysis application for simulating tuning fork vibrations using finite element methods.

## Features

### 🎵 **Modal Analysis Engine**
- **Finite Element Modeling**: 3D tuning fork geometry with configurable dimensions
- **Material Properties**: Support for steel, aluminum, brass, and titanium
- **Modal Frequency Calculation**: Computes natural frequencies and mode shapes
- **Real-time Animation**: Visualize mode shapes with animated displacement fields

### 🎮 **Interactive Controls**
- **3D Visualization**: Rotate, zoom, and pan the tuning fork model
- **Animation Controls**: Play, pause, and adjust simulation speed
- **Mode Selection**: Switch between different vibrational modes
- **Parameter Input**: Real-time tuning fork parameter adjustment

### 📊 **Analysis Results**
- **Frequency Display**: Shows natural frequencies for each mode
- **Mode Shape Visualization**: Animated displacement fields
- **Progress Tracking**: Real-time calculation progress indication
- **Results Panel**: Detailed analysis information and properties

## Architecture

### Backend (Python FastAPI)
- **Modal Analysis Engine**: Finite element calculations using simplified beam theory
- **Material Database**: Predefined material properties (density, Young's modulus, Poisson's ratio)
- **Mesh Generation**: Automatic hexahedral mesh creation
- **REST API**: Endpoints for analysis creation and results retrieval

### Frontend (React + Three.js)
- **3D Visualization**: Tuning fork rendering with Three.js/React Three Fiber
- **Parameter Interface**: Modal dialog for geometry and material input
- **Animation System**: Real-time mode shape animation
- **Control Panels**: Animation controls and results display

## Installation

### Backend Setup
```bash
cd api
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv sync
```

### Frontend Setup
```bash
cd client
pnpm install
```

## Running the Application

### Start the Backend Server
```bash
cd api
uvicorn main:app --reload --port 8000
```

### Start the Frontend Development Server
```bash
cd client
pnpm run dev
```

Open your browser and navigate to `http://localhost:5173`

## Usage

### Getting Started
1. **Select Physics Engine**: Choose "Modal Analysis" from the physics panel
2. **Set Parameters**: Click "Start Simulation" to open the parameter dialog
3. **Configure Geometry**: Set tuning fork dimensions (length, width, thickness, etc.)
4. **Choose Material**: Select from steel, aluminum, brass, or titanium
5. **Start Analysis**: Click "Start Simulation" to begin calculations

### Main View Controls
- **Mouse**: Click and drag to rotate the view
- **Scroll**: Zoom in/out
- **Right-click**: Pan the view
- **Play/Pause**: Control animation playback
- **Speed**: Adjust animation speed (0.5x to 10x)
- **Mode Selection**: Navigate between different vibrational modes

### Parameter Configuration
- **Dimensions**: All measurements in meters
  - Length: 0.01 to 1.0 m (prong length)
  - Width: 0.001 to 0.1 m (prong width)
  - Thickness: 0.0001 to 0.01 m (prong thickness)
  - Handle Length: 0.01 to 0.1 m
  - Handle Width: 0.001 to 0.05 m

- **Material Properties**:
  - **Steel**: Density 7850 kg/m³, Young's Modulus 200 GPa
  - **Aluminum**: Density 2700 kg/m³, Young's Modulus 70 GPa
  - **Brass**: Density 8500 kg/m³, Young's Modulus 110 GPa
  - **Titanium**: Density 4500 kg/m³, Young's Modulus 116 GPa

- **Analysis Settings**:
  - Mesh Resolution: 5 to 50 (elements per unit length)
  - Number of Modes: 1 to 20 (vibrational modes to calculate)

## API Endpoints

### Modal Analysis
- `POST /api/modal/tuning-fork` - Create tuning fork and start analysis
- `GET /api/modal/analysis/{analysis_id}` - Get analysis status
- `GET /api/modal/analysis/{analysis_id}/mode/{mode_number}` - Get specific mode data
- `GET /api/modal/analysis/{analysis_id}/modes` - Get all modes for analysis

### Example Request
```json
{
  "name": "Standard Tuning Fork",
  "length": 0.1,
  "width": 0.02,
  "thickness": 0.005,
  "handle_length": 0.03,
  "handle_width": 0.01,
  "material": "steel",
  "mesh_resolution": 10,
  "num_modes": 5
}
```

### Example Response
```json
{
  "analysis_id": "acc0af5d-e622-421d-9c00-ff10b969c4c8",
  "tuning_fork_id": "Standard Tuning Fork",
  "status": "completed",
  "num_modes": 5,
  "modes": [
    {
      "mode_number": 1,
      "frequency": 407.65,
      "num_nodes": 2
    }
  ]
}
```

## Technical Details

### Modal Analysis Algorithm
The application uses a simplified approach based on beam theory:

1. **Geometry Creation**: Generate 3D tuning fork geometry from parameters
2. **Mesh Generation**: Create hexahedral finite element mesh
3. **Material Assignment**: Apply material properties to elements
4. **Frequency Calculation**: Use beam theory approximation:
   - `f = (1.875² / (2π)) * √(EI / (ρAL⁴))`
   - Where I = wt³/12 for rectangular cross-section
5. **Mode Shape Generation**: Create displacement fields for visualization

### 3D Visualization
- **Geometry**: Constructed from multiple box primitives
- **Animation**: Real-time vertex displacement based on modal results
- **Materials**: Metallic appearance with configurable properties
- **Lighting**: Ambient, directional, and point lights for realistic rendering

## Concept Design

The modal analysis feature follows concept design principles:

- **TuningFork**: Manages geometry and material properties
- **ModalAnalysis**: Handles finite element calculations and results
- **Simulation**: Controls animation state and timing
- **Camera**: Manages 3D view perspective

## Future Enhancements

### Advanced FEM
- **Full FEM Solver**: Integration with FEniCS or SfePy for accurate calculations
- **N-body Physics**: More complex vibrational analysis
- **Non-linear Analysis**: Large deformation and contact effects

### Visualization Improvements
- **Stress/Strain Visualization**: Color-coded stress field display
- **Mesh Quality**: Adaptive mesh refinement
- **Export Options**: Save results as images or animations

### Additional Features
- **Multiple Objects**: Compare different tuning fork designs
- **Frequency Response**: Forced vibration analysis
- **Optimization**: Automatic parameter optimization for target frequencies
- **Batch Processing**: Multiple analyses in parallel

## Troubleshooting

### Common Issues
1. **Backend Not Running**: Ensure uvicorn server is started on port 8000
2. **Calculation Errors**: Check parameter ranges and material selection
3. **Visualization Issues**: Verify Three.js dependencies are installed
4. **Performance**: Reduce mesh resolution for faster calculations

### Debug Information
- Check browser console for frontend errors
- Monitor backend logs for calculation issues
- Verify WebSocket connection status
- Test API endpoints directly with curl

## Contributing

The modal analysis feature is designed to be extensible:

1. **Add New Materials**: Extend the material database in `modal_analysis.py`
2. **Improve FEM**: Replace simplified calculations with full FEM solver
3. **Enhance Visualization**: Add new rendering modes and effects
4. **Extend Geometry**: Support more complex tuning fork shapes

## License

This project follows the same license as the main application.
