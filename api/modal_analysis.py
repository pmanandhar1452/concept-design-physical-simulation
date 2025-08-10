"""
Modal Analysis Module for Tuning Fork Finite Element Analysis
"""

import numpy as np
import uuid
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

# For FEM calculations - we'll use a simplified approach for now
# In production, you'd use FEniCS, SfePy, or similar libraries


@dataclass
class TuningForkGeometry:
    """Represents the geometry of a tuning fork"""

    length: float  # Length of the prongs (m)
    width: float  # Width of the prongs (m)
    thickness: float  # Thickness of the prongs (m)
    handle_length: float  # Length of the handle (m)
    handle_width: float  # Width of the handle (m)
    mesh_resolution: int  # Number of elements per unit length


@dataclass
class MaterialProperties:
    """Represents material properties for the tuning fork"""

    name: str
    density: float  # kg/m³
    youngs_modulus: float  # Pa
    poissons_ratio: float


@dataclass
class ModalResult:
    """Represents a single modal result"""

    mode_number: int
    frequency: float  # Hz
    displacement_field: np.ndarray  # Shape: (n_nodes, 3)
    mesh_vertices: np.ndarray  # Shape: (n_nodes, 3)
    mesh_elements: np.ndarray  # Shape: (n_elements, 8) for hex elements


class ModalAnalyzer:
    """Performs modal analysis on tuning fork geometry"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Predefined materials
        self.materials = {
            "steel": MaterialProperties("steel", 7850, 200e9, 0.3),
            "aluminum": MaterialProperties("aluminum", 2700, 70e9, 0.33),
            "brass": MaterialProperties("brass", 8500, 110e9, 0.34),
            "titanium": MaterialProperties("titanium", 4500, 116e9, 0.32),
        }

    def create_mesh(
        self, geometry: TuningForkGeometry
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create a mesh for the circular tuning fork
        Returns: (vertices, elements)
        """
        # Create a simplified mesh for circular cross-sections
        l, w, t = geometry.length, geometry.width, geometry.thickness
        hl, hw = geometry.handle_length, geometry.handle_width
        res = geometry.mesh_resolution

        # Create vertices along the length with circular cross-sections
        vertices = []
        elements = []

        # Number of segments for circular cross-section
        segments = max(8, int(res * 2))

        # Helper function to create circular cross-section in 3D space
        def create_circle_section(center_x, center_y, center_z, radius, segments, normal_x=0, normal_y=0, normal_z=1):
            section_vertices = []
            
            # Create local coordinate system
            up = [0, 1, 0]
            right = [1, 0, 0]
            
            # If normal is not pointing in Z direction, create proper local coordinates
            if abs(normal_z) < 0.99:
                temp = [0, 0, 1]
                right[0] = normal_y * temp[2] - normal_z * temp[1]
                right[1] = normal_z * temp[0] - normal_x * temp[2]
                right[2] = normal_x * temp[1] - normal_y * temp[0]
                
                up[0] = normal_y * right[2] - normal_z * right[1]
                up[1] = normal_z * right[0] - normal_x * right[2]
                up[2] = normal_x * right[1] - normal_y * right[0]
            
            for i in range(segments):
                angle = (i / segments) * 2 * np.pi
                x = center_x + radius * (np.cos(angle) * right[0] + np.sin(angle) * up[0])
                y = center_y + radius * (np.cos(angle) * right[1] + np.sin(angle) * up[1])
                z = center_z + radius * (np.cos(angle) * right[2] + np.sin(angle) * up[2])
                section_vertices.append([x, y, z])
            return section_vertices

        # U-shape parameters
        prong_spacing = hl * 0.8  # Space between prongs
        curve_radius = prong_spacing * 0.3  # Radius of the curve
        prong_length = l - hl / 2 - curve_radius  # Length of straight prong sections

                # Create handle vertices (horizontal cylinder along X-axis)
        handle_sections = max(3, int(hl * res))
        for i in range(handle_sections + 1):
            x = -hl / 2 + (i / handle_sections) * hl
            section = create_circle_section(x, 0, 0, hw / 2, segments, 1, 0, 0)  # Normal along X-axis
            vertices.extend(section)
        
        # Create left side: handle to curve (vertical drop)
        left_handle_sections = max(2, int(curve_radius * res))
        for i in range(left_handle_sections + 1):
            x = -hl / 2
            y = -(i / left_handle_sections) * curve_radius
            section = create_circle_section(x, y, 0, w / 2, segments, 0, 1, 0)  # Normal along Y-axis
            vertices.extend(section)
        
        # Create left curve (semi-circle)
        curve_sections = max(4, int(curve_radius * np.pi * res / 2))
        for i in range(curve_sections + 1):
            angle = (i / curve_sections) * np.pi
            x = -hl / 2 + curve_radius * np.cos(angle)
            y = -curve_radius + curve_radius * np.sin(angle)
            # Calculate tangent direction for proper orientation
            tangent_x = -curve_radius * np.sin(angle)
            tangent_y = curve_radius * np.cos(angle)
            tangent_z = 0
            tangent_length = np.sqrt(tangent_x**2 + tangent_y**2 + tangent_z**2)
            normal_x = tangent_x / tangent_length
            normal_y = tangent_y / tangent_length
            normal_z = tangent_z / tangent_length
            section = create_circle_section(x, y, 0, w / 2, segments, normal_x, normal_y, normal_z)
            vertices.extend(section)
        
        # Create left prong (vertical cylinder)
        left_prong_sections = max(5, int(prong_length * res))
        for i in range(left_prong_sections + 1):
            x = -hl / 2
            y = -curve_radius * 2 - (i / left_prong_sections) * prong_length
            section = create_circle_section(x, y, 0, w / 2, segments, 0, 1, 0)  # Normal along Y-axis
            vertices.extend(section)
        
        # Create right side: handle to curve (vertical drop)
        right_handle_sections = max(2, int(curve_radius * res))
        for i in range(right_handle_sections + 1):
            x = hl / 2
            y = -(i / right_handle_sections) * curve_radius
            section = create_circle_section(x, y, 0, w / 2, segments, 0, 1, 0)  # Normal along Y-axis
            vertices.extend(section)
        
        # Create right curve (semi-circle)
        for i in range(curve_sections + 1):
            angle = (i / curve_sections) * np.pi
            x = hl / 2 + curve_radius * np.cos(angle)
            y = -curve_radius + curve_radius * np.sin(angle)
            # Calculate tangent direction for proper orientation
            tangent_x = -curve_radius * np.sin(angle)
            tangent_y = curve_radius * np.cos(angle)
            tangent_z = 0
            tangent_length = np.sqrt(tangent_x**2 + tangent_y**2 + tangent_z**2)
            normal_x = tangent_x / tangent_length
            normal_y = tangent_y / tangent_length
            normal_z = tangent_z / tangent_length
            section = create_circle_section(x, y, 0, w / 2, segments, normal_x, normal_y, normal_z)
            vertices.extend(section)
        
        # Create right prong (vertical cylinder)
        right_prong_sections = max(5, int(prong_length * res))
        for i in range(right_prong_sections + 1):
            x = hl / 2
            y = -curve_radius * 2 - (i / right_prong_sections) * prong_length
            section = create_circle_section(x, y, 0, w / 2, segments, 0, 1, 0)  # Normal along Y-axis
            vertices.extend(section)

        # Create simple triangular elements (simplified for visualization)
        vertices = np.array(vertices)
        n_vertices = len(vertices)

        # Create simple triangular mesh (for visualization purposes)
        # In a real FEM implementation, you'd use proper tetrahedral or hexahedral elements
        for i in range(0, n_vertices - segments - 1, segments):
            for j in range(segments):
                next_j = (j + 1) % segments
                # Create two triangles for each quad
                elements.append([i + j, i + next_j, i + segments + j])
                elements.append([i + next_j, i + segments + next_j, i + segments + j])

        return vertices, np.array(elements)

    def calculate_modes(
        self,
        geometry: TuningForkGeometry,
        material: MaterialProperties,
        num_modes: int = 5,
    ) -> List[ModalResult]:
        """
        Calculate modal frequencies and shapes for the tuning fork
        """
        self.logger.info(f"Starting modal analysis for {num_modes} modes")

        # Create mesh
        vertices, elements = self.create_mesh(geometry)
        n_nodes = len(vertices)

        # Simplified modal analysis using analytical approximation
        # In practice, you'd solve the full FEM eigenvalue problem

        modes = []
        for i in range(num_modes):
            # Simplified frequency calculation based on beam theory
            # For a tuning fork, the fundamental frequency is approximately:
            # f = (1.875^2 / (2π)) * sqrt(EI / (ρAL^4))
            # where I = wt^3/12 for rectangular cross-section

            L = geometry.length
            w = geometry.width
            t = geometry.thickness
            E = material.youngs_modulus
            rho = material.density

            # Moment of inertia for rectangular cross-section
            I = w * t**3 / 12
            A = w * t

            # Frequency calculation (simplified)
            if i == 0:
                # Fundamental frequency
                freq = (1.875**2 / (2 * np.pi)) * np.sqrt(E * I / (rho * A * L**4))
            else:
                # Higher modes (simplified scaling)
                freq = (
                    (1.875**2 / (2 * np.pi))
                    * np.sqrt(E * I / (rho * A * L**4))
                    * (2 * i + 1) ** 2
                )

            # Generate displacement field (simplified)
            # In practice, this would come from solving the FEM eigenvalue problem
            displacement_field = self._generate_displacement_field(
                vertices, freq, i, geometry, material
            )

            mode = ModalResult(
                mode_number=i + 1,
                frequency=freq,
                displacement_field=displacement_field,
                mesh_vertices=vertices,
                mesh_elements=elements,
            )
            modes.append(mode)

            self.logger.info(f"Mode {i+1}: {freq:.2f} Hz")

        return modes

    def _generate_displacement_field(
        self,
        vertices: np.ndarray,
        frequency: float,
        mode_number: int,
        geometry: TuningForkGeometry,
        material: MaterialProperties,
    ) -> np.ndarray:
        """
        Generate a simplified displacement field for visualization
        """
        n_nodes = len(vertices)
        displacement = np.zeros((n_nodes, 3))

        # Simplified displacement field based on beam theory
        for i, (x, y, z) in enumerate(vertices):
            # Normalize coordinates
            x_norm = x / geometry.length
            y_norm = y / geometry.width
            z_norm = z / geometry.thickness

            # Generate mode shape (simplified)
            if mode_number == 0:
                # First bending mode
                amplitude = np.sin(np.pi * x_norm) * np.cos(np.pi * y_norm)
                displacement[i, 1] = amplitude * 0.01  # Y-direction (bending)
            elif mode_number == 1:
                # Second bending mode
                amplitude = np.sin(2 * np.pi * x_norm) * np.cos(np.pi * y_norm)
                displacement[i, 1] = amplitude * 0.005  # Y-direction
            elif mode_number == 2:
                # Torsional mode
                amplitude = np.sin(np.pi * x_norm) * np.sin(np.pi * z_norm)
                displacement[i, 2] = amplitude * 0.008  # Z-direction
            else:
                # Higher modes
                amplitude = np.sin((mode_number + 1) * np.pi * x_norm) * np.cos(
                    np.pi * y_norm
                )
                displacement[i, 1] = amplitude * 0.003  # Y-direction

        return displacement


class ModalAnalysisManager:
    """Manages modal analysis sessions and results"""

    def __init__(self):
        self.analyzer = ModalAnalyzer()
        self.active_analyses: Dict[str, Dict] = {}
        self.results: Dict[str, List[ModalResult]] = {}
        self.logger = logging.getLogger(__name__)

    def start_analysis(
        self,
        tuning_fork_id: str,
        geometry: TuningForkGeometry,
        material_name: str,
        num_modes: int,
    ) -> str:
        """Start a new modal analysis"""
        analysis_id = str(uuid.uuid4())

        # Get material properties
        if material_name not in self.analyzer.materials:
            raise ValueError(f"Unknown material: {material_name}")

        material = self.analyzer.materials[material_name]

        # Store analysis info
        self.active_analyses[analysis_id] = {
            "tuning_fork_id": tuning_fork_id,
            "geometry": geometry,
            "material": material,
            "num_modes": num_modes,
            "status": "calculating",
            "progress": 0.0,
        }

        self.logger.info(f"Started analysis {analysis_id} for {num_modes} modes")
        return analysis_id

    def get_analysis_status(self, analysis_id: str) -> Dict:
        """Get the status of an analysis"""
        if analysis_id not in self.active_analyses:
            raise ValueError(f"Analysis {analysis_id} not found")

        return self.active_analyses[analysis_id].copy()

    def complete_analysis(self, analysis_id: str) -> List[ModalResult]:
        """Complete the analysis and return results"""
        if analysis_id not in self.active_analyses:
            raise ValueError(f"Analysis {analysis_id} not found")

        analysis = self.active_analyses[analysis_id]

        # Perform the actual calculation
        modes = self.analyzer.calculate_modes(
            analysis["geometry"], analysis["material"], analysis["num_modes"]
        )

        # Store results
        self.results[analysis_id] = modes
        analysis["status"] = "completed"
        analysis["progress"] = 1.0

        self.logger.info(f"Completed analysis {analysis_id} with {len(modes)} modes")
        return modes

    def get_mode_data(
        self, analysis_id: str, mode_number: int
    ) -> Optional[ModalResult]:
        """Get data for a specific mode"""
        if analysis_id not in self.results:
            raise ValueError(f"Analysis {analysis_id} not found or not completed")

        modes = self.results[analysis_id]
        if mode_number < 1 or mode_number > len(modes):
            raise ValueError(f"Mode {mode_number} not found")

        return modes[mode_number - 1]

    def get_all_modes(self, analysis_id: str) -> List[ModalResult]:
        """Get all modes for an analysis"""
        if analysis_id not in self.results:
            raise ValueError(f"Analysis {analysis_id} not found or not completed")

        return self.results[analysis_id]
