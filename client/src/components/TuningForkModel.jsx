import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function TuningForkModel({
  tuningForkData,
  modalResults,
  currentMode,
  animationPhase,
  isCalculating,
}) {
  const meshRef = useRef();
  const [geometry, setGeometry] = useState(null);
  const [displacementField, setDisplacementField] = useState(null);
  const [originalVertices, setOriginalVertices] = useState(null);

  // Create tuning fork geometry
  useEffect(() => {
    if (!tuningForkData) {
      // Default tuning fork geometry
      const defaultGeometry = createTuningForkGeometry(
        0.1,
        0.02,
        0.005,
        0.03,
        0.01
      );
      setGeometry(defaultGeometry);
      setOriginalVertices(defaultGeometry.attributes.position.array.slice());
      return;
    }

    const { length, width, thickness, handle_length, handle_width } =
      tuningForkData;
    const newGeometry = createTuningForkGeometry(
      length,
      width,
      thickness,
      handle_length,
      handle_width
    );
    setGeometry(newGeometry);
    setOriginalVertices(newGeometry.attributes.position.array.slice());
  }, [tuningForkData]);

  // Load modal displacement data
  useEffect(() => {
    if (!modalResults || !modalResults.analysis_id) return;

    const loadModeData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/modal/analysis/${modalResults.analysis_id}/mode/${currentMode}`
        );
        if (response.ok) {
          const modeData = await response.json();
          setDisplacementField(modeData.displacement_field);
        }
      } catch (error) {
        console.error("Error loading mode data:", error);
      }
    };

    loadModeData();
  }, [modalResults, currentMode]);

  // Animation frame update
  useFrame(() => {
    if (
      !meshRef.current ||
      !geometry ||
      !displacementField ||
      !originalVertices
    )
      return;

    const positions = geometry.attributes.position.array;
    const numVertices = positions.length / 3;

    for (let i = 0; i < numVertices; i++) {
      const x = originalVertices[i * 3];
      const y = originalVertices[i * 3 + 1];
      const z = originalVertices[i * 3 + 2];

      // Apply modal displacement with animation
      if (i < displacementField.length) {
        const disp = displacementField[i];
        const amplitude = Math.sin(animationPhase);

        positions[i * 3] = x + disp[0] * amplitude * 0.1; // Scale for visibility
        positions[i * 3 + 1] = y + disp[1] * amplitude * 0.1;
        positions[i * 3 + 2] = z + disp[2] * amplitude * 0.1;
      } else {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  if (!geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={isCalculating ? "#cccccc" : "#e0e0e0"}
        metalness={0.3}
        roughness={0.4}
        transparent={true}
        opacity={isCalculating ? 0.7 : 1.0}
        emissive={displacementField ? "#404040" : "#000000"}
        emissiveIntensity={displacementField ? 0.1 : 0}
      />
    </mesh>
  );
}

function createTuningForkGeometry(
  length,
  width,
  thickness,
  handle_length,
  handle_width
) {
  const geometry = new THREE.BufferGeometry();

  // Create a U-shaped tuning fork
  const vertices = [];
  const indices = [];

  // Parameters for circular cross-sections
  const handleRadius = handle_width / 2;
  const prongRadius = width / 2;
  const segments = 12; // Number of segments for circular cross-sections

  // U-shape parameters
  const prongSpacing = handle_length * 0.8; // Space between prongs
  const curveRadius = prongSpacing * 0.3; // Radius of the curve
  const prongLength = length - handle_length / 2 - curveRadius; // Length of straight prong sections

  // Helper function to create circular vertices in 3D space
  function createCircleVertices(
    centerX,
    centerY,
    centerZ,
    radius,
    segments,
    normalX = 0,
    normalY = 0,
    normalZ = 1
  ) {
    const circleVertices = [];

    // Create a local coordinate system
    const up = [0, 1, 0];
    const right = [1, 0, 0];

    // If normal is not pointing in Z direction, create proper local coordinates
    if (Math.abs(normalZ) < 0.99) {
      const temp = [0, 0, 1];
      right[0] = normalY * temp[2] - normalZ * temp[1];
      right[1] = normalZ * temp[0] - normalX * temp[2];
      right[2] = normalX * temp[1] - normalY * temp[0];

      up[0] = normalY * right[2] - normalZ * right[1];
      up[1] = normalZ * right[0] - normalX * right[2];
      up[2] = normalX * right[1] - normalY * right[0];
    }

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x =
        centerX +
        radius * (Math.cos(angle) * right[0] + Math.sin(angle) * up[0]);
      const y =
        centerY +
        radius * (Math.cos(angle) * right[1] + Math.sin(angle) * up[1]);
      const z =
        centerZ +
        radius * (Math.cos(angle) * right[2] + Math.sin(angle) * up[2]);
      circleVertices.push(x, y, z);
    }
    return circleVertices;
  }

  // Helper function to create cylinder between two circles with proper 3D orientation
  function createCylinderVertices(
    startX,
    startY,
    startZ,
    endX,
    endY,
    endZ,
    radius,
    segments
  ) {
    const cylinderVertices = [];
    const cylinderIndices = [];

    // Calculate direction vector
    const dirX = endX - startX;
    const dirY = endY - startY;
    const dirZ = endZ - startZ;
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

    // Normalize direction
    const normalX = dirX / length;
    const normalY = dirY / length;
    const normalZ = dirZ / length;

    // Create start circle with proper orientation
    const startCircle = createCircleVertices(
      startX,
      startY,
      startZ,
      radius,
      segments,
      normalX,
      normalY,
      normalZ
    );
    cylinderVertices.push(...startCircle);

    // Create end circle with proper orientation
    const endCircle = createCircleVertices(
      endX,
      endY,
      endZ,
      radius,
      segments,
      normalX,
      normalY,
      normalZ
    );
    cylinderVertices.push(...endCircle);

    // Create indices for cylinder faces
    const startOffset = 0;
    const endOffset = segments + 1;

    // Side faces
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;

      // First triangle
      cylinderIndices.push(startOffset + i, startOffset + next, endOffset + i);

      // Second triangle
      cylinderIndices.push(startOffset + next, endOffset + next, endOffset + i);
    }

    // End caps
    for (let i = 1; i < segments - 1; i++) {
      // Start cap
      cylinderIndices.push(startOffset, startOffset + i, startOffset + i + 1);
      // End cap
      cylinderIndices.push(endOffset, endOffset + i + 1, endOffset + i);
    }

    return { vertices: cylinderVertices, indices: cylinderIndices };
  }

  // Helper function to create curved cylinder (for U-shape) with proper 3D orientation
  function createCurvedCylinder(
    startX,
    startY,
    startZ,
    centerX,
    centerY,
    centerZ,
    radius,
    segments,
    curveSegments
  ) {
    const cylinderVertices = [];
    const cylinderIndices = [];

    for (let i = 0; i <= curveSegments; i++) {
      const angle = (i / curveSegments) * Math.PI; // Half circle
      const x = centerX + curveRadius * Math.cos(angle);
      const y = centerY + curveRadius * Math.sin(angle);
      const z = centerZ;

      // Calculate tangent direction for proper circle orientation
      const tangentX = -curveRadius * Math.sin(angle);
      const tangentY = curveRadius * Math.cos(angle);
      const tangentZ = 0;

      // Normalize tangent
      const tangentLength = Math.sqrt(
        tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ
      );
      const normalX = tangentX / tangentLength;
      const normalY = tangentY / tangentLength;
      const normalZ = tangentZ / tangentLength;

      const circle = createCircleVertices(
        x,
        y,
        z,
        radius,
        segments,
        normalX,
        normalY,
        normalZ
      );
      cylinderVertices.push(...circle);
    }

    // Create indices for curved cylinder
    for (let i = 0; i < curveSegments; i++) {
      const currentOffset = i * (segments + 1);
      const nextOffset = (i + 1) * (segments + 1);

      for (let j = 0; j < segments; j++) {
        const next = (j + 1) % segments;

        // First triangle
        cylinderIndices.push(
          currentOffset + j,
          currentOffset + next,
          nextOffset + j
        );

        // Second triangle
        cylinderIndices.push(
          currentOffset + next,
          nextOffset + next,
          nextOffset + j
        );
      }
    }

    return { vertices: cylinderVertices, indices: cylinderIndices };
  }

  let vertexOffset = 0;

  // Handle (center part) - horizontal cylinder along X-axis
  const handleCylinder = createCylinderVertices(
    -handle_length / 2,
    0,
    0,
    handle_length / 2,
    0,
    0,
    handleRadius,
    segments
  );
  vertices.push(...handleCylinder.vertices);
  indices.push(...handleCylinder.indices.map((i) => i + vertexOffset));
  vertexOffset += handleCylinder.vertices.length / 3;

  // Left side: Handle to curve (vertical drop)
  const leftHandleToCurve = createCylinderVertices(
    -handle_length / 2,
    0,
    0,
    -handle_length / 2,
    -curveRadius,
    0,
    prongRadius,
    segments
  );
  vertices.push(...leftHandleToCurve.vertices);
  indices.push(...leftHandleToCurve.indices.map((i) => i + vertexOffset));
  vertexOffset += leftHandleToCurve.vertices.length / 3;

  // Left curve (semi-circle)
  const leftCurve = createCurvedCylinder(
    -handle_length / 2,
    -curveRadius,
    0,
    -handle_length / 2,
    -curveRadius,
    0,
    prongRadius,
    segments,
    8
  );
  vertices.push(...leftCurve.vertices);
  indices.push(...leftCurve.indices.map((i) => i + vertexOffset));
  vertexOffset += leftCurve.vertices.length / 3;

  // Left prong (vertical cylinder)
  const leftProng = createCylinderVertices(
    -handle_length / 2,
    -curveRadius * 2,
    0,
    -handle_length / 2,
    -curveRadius * 2 - prongLength,
    0,
    prongRadius,
    segments
  );
  vertices.push(...leftProng.vertices);
  indices.push(...leftProng.indices.map((i) => i + vertexOffset));
  vertexOffset += leftProng.vertices.length / 3;

  // Right side: Handle to curve (vertical drop)
  const rightHandleToCurve = createCylinderVertices(
    handle_length / 2,
    0,
    0,
    handle_length / 2,
    -curveRadius,
    0,
    prongRadius,
    segments
  );
  vertices.push(...rightHandleToCurve.vertices);
  indices.push(...rightHandleToCurve.indices.map((i) => i + vertexOffset));
  vertexOffset += rightHandleToCurve.vertices.length / 3;

  // Right curve (semi-circle)
  const rightCurve = createCurvedCylinder(
    handle_length / 2,
    -curveRadius,
    0,
    handle_length / 2,
    -curveRadius,
    0,
    prongRadius,
    segments,
    8
  );
  vertices.push(...rightCurve.vertices);
  indices.push(...rightCurve.indices.map((i) => i + vertexOffset));
  vertexOffset += rightCurve.vertices.length / 3;

  // Right prong (vertical cylinder)
  const rightProng = createCylinderVertices(
    handle_length / 2,
    -curveRadius * 2,
    0,
    handle_length / 2,
    -curveRadius * 2 - prongLength,
    0,
    prongRadius,
    segments
  );
  vertices.push(...rightProng.vertices);
  indices.push(...rightProng.indices.map((i) => i + vertexOffset));

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
