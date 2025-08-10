import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import Editor from "@monaco-editor/react";

// OpenSCAD Parser (simplified for basic operations)
class OpenSCADParser {
  constructor() {
    this.variables = {};
    this.functions = {};
  }

  parse(code) {
    try {
      // Extract variables
      const varMatches = code.match(/(\w+)\s*=\s*([^;]+);/g);
      if (varMatches) {
        varMatches.forEach((match) => {
          const [name, value] = match.split("=").map((s) => s.trim());
          const cleanName = name.trim();
          const cleanValue = value.replace(";", "").trim();
          this.variables[cleanName] = this.evaluateExpression(cleanValue);
        });
      }

      // Extract main geometry - handle both union and direct geometry
      let geometryMatch = code.match(/union\s*\(\s*{([^}]+)}\s*\)/);
      if (geometryMatch) {
        return this.parseGeometry(geometryMatch[1]);
      }

      // If no union, try to parse the entire code as geometry
      geometryMatch = code.match(
        /(cylinder\s*\([^)]+\)|curved_cylinder\s*\([^)]+\))/g
      );
      if (geometryMatch) {
        return this.parseGeometry(code);
      }

      return null;
    } catch (error) {
      console.error("OpenSCAD parsing error:", error);
      return null;
    }
  }

  evaluateExpression(expr) {
    // Simple expression evaluator for basic math
    try {
      // Replace variable references
      let evaluated = expr;
      Object.keys(this.variables).forEach((varName) => {
        const regex = new RegExp(`\\b${varName}\\b`, "g");
        evaluated = evaluated.replace(regex, this.variables[varName]);
      });

      // Evaluate basic math expressions
      return eval(evaluated);
    } catch (error) {
      return parseFloat(expr) || 0;
    }
  }

  parseGeometry(geometryCode) {
    const cylinders = [];
    const spheres = [];
    const cubes = [];
    const curvedCylinders = [];

    // Parse cylinder operations
    const cylinderMatches = geometryCode.match(
      /cylinder\s*\(\s*h\s*=\s*([^,]+),\s*r\s*=\s*([^,]+)\s*\)/g
    );
    if (cylinderMatches) {
      cylinderMatches.forEach((match, index) => {
        const hMatch = match.match(/h\s*=\s*([^,]+)/);
        const rMatch = match.match(/r\s*=\s*([^,]+)/);
        if (hMatch && rMatch) {
          const height = this.evaluateExpression(hMatch[1]);
          const radius = this.evaluateExpression(rMatch[1]);
          cylinders.push({ height, radius, index });
        }
      });
    }

    // Parse curved cylinder operations (custom function)
    const curvedCylinderMatches = geometryCode.match(
      /curved_cylinder\s*\(\s*start\s*=\s*\[([^\]]+)\],\s*end\s*=\s*\[([^\]]+)\],\s*r\s*=\s*([^,]+)\s*\)/g
    );
    if (curvedCylinderMatches) {
      curvedCylinderMatches.forEach((match, index) => {
        const startMatch = match.match(/start\s*=\s*\[([^\]]+)\]/);
        const endMatch = match.match(/end\s*=\s*\[([^\]]+)\]/);
        const rMatch = match.match(/r\s*=\s*([^,]+)/);
        if (startMatch && endMatch && rMatch) {
          const start = startMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          const end = endMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          const radius = this.evaluateExpression(rMatch[1]);
          curvedCylinders.push({ start, end, radius, index });
        }
      });
    }

    // Parse translate operations and associate with cylinders
    const translateMatches = geometryCode.match(
      /translate\s*\(\s*\[([^\]]+)\]\s*\)/g
    );
    if (translateMatches) {
      translateMatches.forEach((match, index) => {
        const coordsMatch = match.match(/\[([^\]]+)\]/);
        if (coordsMatch) {
          const coords = coordsMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          if (cylinders[index]) {
            cylinders[index].position = coords;
          }
        }
      });
    }

    // Parse translate-rotate-cylinder patterns
    const translateRotateCylinderMatches = geometryCode.match(
      /translate\s*\(\s*\[([^\]]+)\]\s*\)\s*\n\s*rotate\s*\(\s*\[([^\]]+)\]\s*\)\s*\n\s*cylinder\s*\(\s*h\s*=\s*([^,]+),\s*r\s*=\s*([^,]+)\s*\)/g
    );
    if (translateRotateCylinderMatches) {
      translateRotateCylinderMatches.forEach((match) => {
        const coordsMatch = match.match(/translate\s*\(\s*\[([^\]]+)\]\s*\)/);
        const rotateMatch = match.match(/rotate\s*\(\s*\[([^\]]+)\]\s*\)/);
        const cylinderMatch = match.match(
          /cylinder\s*\(\s*h\s*=\s*([^,]+),\s*r\s*=\s*([^,]+)\s*\)/
        );
        if (coordsMatch && rotateMatch && cylinderMatch) {
          const coords = coordsMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          const rotation = rotateMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          const height = this.evaluateExpression(cylinderMatch[1]);
          const radius = this.evaluateExpression(cylinderMatch[2]);
          cylinders.push({ height, radius, position: coords, rotation });
        }
      });
    }

    // Parse translate-cylinder patterns (without rotation)
    const translateCylinderMatches = geometryCode.match(
      /translate\s*\(\s*\[([^\]]+)\]\s*\)\s*\n\s*cylinder\s*\(\s*h\s*=\s*([^,]+),\s*r\s*=\s*([^,]+)\s*\)/g
    );
    if (translateCylinderMatches) {
      translateCylinderMatches.forEach((match) => {
        const coordsMatch = match.match(/translate\s*\(\s*\[([^\]]+)\]\s*\)/);
        const cylinderMatch = match.match(
          /cylinder\s*\(\s*h\s*=\s*([^,]+),\s*r\s*=\s*([^,]+)\s*\)/
        );
        if (coordsMatch && cylinderMatch) {
          const coords = coordsMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          const height = this.evaluateExpression(cylinderMatch[1]);
          const radius = this.evaluateExpression(cylinderMatch[2]);
          cylinders.push({ height, radius, position: coords });
        }
      });
    }

    // Parse rotate operations
    const rotateMatches = geometryCode.match(
      /rotate\s*\(\s*\[([^\]]+)\]\s*\)/g
    );
    if (rotateMatches) {
      rotateMatches.forEach((match, index) => {
        const anglesMatch = match.match(/\[([^\]]+)\]/);
        if (anglesMatch) {
          const angles = anglesMatch[1]
            .split(",")
            .map((c) => this.evaluateExpression(c.trim()));
          if (cylinders[index]) {
            cylinders[index].rotation = angles;
          }
        }
      });
    }

    return { cylinders, spheres, cubes, curvedCylinders };
  }
}

// OpenSCAD Renderer for Three.js
class OpenSCADRenderer {
  constructor() {
    this.parser = new OpenSCADParser();
  }

  render(code) {
    const geometry = this.parser.parse(code);
    if (!geometry) {
      console.warn("Failed to parse OpenSCAD code, creating fallback geometry");
      // Create a simple fallback geometry
      const group = new THREE.Group();
      const cylinderGeometry = new THREE.CylinderGeometry(10, 10, 40, 12);
      const material = new THREE.MeshStandardMaterial({
        color: "#e0e0e0",
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(cylinderGeometry, material);
      group.add(mesh);
      return group;
    }

    const group = new THREE.Group();

    // Render cylinders
    geometry.cylinders.forEach((cylinder) => {
      const cylinderGeometry = new THREE.CylinderGeometry(
        cylinder.radius,
        cylinder.radius,
        cylinder.height,
        12
      );
      const material = new THREE.MeshStandardMaterial({
        color: "#e0e0e0",
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(cylinderGeometry, material);

      if (cylinder.position) {
        mesh.position.set(
          cylinder.position[0],
          cylinder.position[1],
          cylinder.position[2]
        );
      }

      if (cylinder.rotation) {
        mesh.rotation.set(
          (cylinder.rotation[0] * Math.PI) / 180,
          (cylinder.rotation[1] * Math.PI) / 180,
          (cylinder.rotation[2] * Math.PI) / 180
        );
      }

      group.add(mesh);
    });

    // Render curved cylinders
    geometry.curvedCylinders.forEach((curvedCylinder) => {
      const { start, end, radius } = curvedCylinder;

      // Calculate direction vector
      const dirX = end[0] - start[0];
      const dirY = end[1] - start[1];
      const dirZ = end[2] - start[2];
      const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

      // Create cylinder geometry
      const cylinderGeometry = new THREE.CylinderGeometry(
        radius,
        radius,
        length,
        12
      );
      const material = new THREE.MeshStandardMaterial({
        color: "#e0e0e0",
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(cylinderGeometry, material);

      // Position at midpoint
      mesh.position.set(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2
      );

      // Rotate to align with direction
      if (length > 0) {
        const angleY = Math.atan2(dirX, dirZ);
        const angleX = Math.asin(-dirY / length);
        mesh.rotation.set(angleX, angleY, 0);
      }

      group.add(mesh);
    });

    return group;
  }
}

const OpenSCADEditor = ({ onGeometryChange }) => {
  const [code, setCode] = useState(`// Simple Tuning Fork OpenSCAD Code
// Adjust these parameters to modify the tuning fork

// Dimensions (in mm)
length = 120;        // Total length
width = 20;          // Prong diameter
handle_length = 40;  // Handle length
handle_width = 15;   // Handle diameter

// Calculate derived dimensions
prong_length = length - handle_length/2;
prong_spacing = handle_length * 0.8;

// Handle (horizontal cylinder)
translate([0, 0, 0])
cylinder(h = handle_length, r = handle_width/2);

// Left prong (vertical cylinder)
translate([-prong_spacing/2, -handle_length/2, 0])
rotate([90, 0, 0])
cylinder(h = prong_length, r = width/2);

// Right prong (vertical cylinder)
translate([prong_spacing/2, -handle_length/2, 0])
rotate([90, 0, 0])
cylinder(h = prong_length, r = width/2);

// Test simple cylinder
cylinder(h = 50, r = 10);`);

  const [error, setError] = useState("");
  const renderer = useRef(new OpenSCADRenderer());
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    try {
      console.log("Parsing OpenSCAD code:", code);
      const newGeometry = renderer.current.render(code);
      console.log("Generated geometry:", newGeometry);
      setGeometry(newGeometry);
      setError("");
      if (onGeometryChange) {
        onGeometryChange(newGeometry);
      }
    } catch (err) {
      console.error("OpenSCAD parsing error:", err);
      setError(`OpenSCAD Error: ${err.message}`);
    }
  }, [code, onGeometryChange]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleReset = () => {
    setCode(`// Simple Tuning Fork OpenSCAD Code
// Adjust these parameters to modify the tuning fork

// Dimensions (in mm)
length = 120;        // Total length
width = 20;          // Prong diameter
handle_length = 40;  // Handle length
handle_width = 15;   // Handle diameter

// Calculate derived dimensions
prong_length = length - handle_length/2;
prong_spacing = handle_length * 0.8;

// Handle (horizontal cylinder)
translate([0, 0, 0])
cylinder(h = handle_length, r = handle_width/2);

// Left prong (vertical cylinder)
translate([-prong_spacing/2, -handle_length/2, 0])
rotate([90, 0, 0])
cylinder(h = prong_length, r = width/2);

// Right prong (vertical cylinder)
translate([prong_spacing/2, -handle_length/2, 0])
rotate([90, 0, 0])
cylinder(h = prong_length, r = width/2);`);
  };

  return (
    <div className="flex h-full">
      {/* Code Editor */}
      <div className="w-1/2 p-4 bg-gray-900">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">
            OpenSCAD Code Editor
          </h3>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reset
          </button>
          <button
            onClick={() => {
              const testCode = `// Test code
cylinder(h = 50, r = 10);`;
              setCode(testCode);
            }}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
          >
            Test
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <div className="h-96 border border-gray-600 rounded overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="openscad"
            value={code}
            onChange={(value) => handleCodeChange(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
            }}
            beforeMount={(monaco) => {
              // Define OpenSCAD language
              monaco.languages.register({ id: "openscad" });

              // Add OpenSCAD completion provider
              monaco.languages.registerCompletionItemProvider("openscad", {
                provideCompletionItems: (model, position) => {
                  const suggestions = [
                    {
                      label: "cylinder",
                      kind: monaco.languages.CompletionItemKind.Function,
                      insertText: "cylinder(h = ${1:height}, r = ${2:radius});",
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                      documentation: "Create a cylinder with height and radius",
                    },
                    {
                      label: "translate",
                      kind: monaco.languages.CompletionItemKind.Function,
                      insertText: "translate([${1:x}, ${2:y}, ${3:z}])",
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                      documentation: "Translate object by vector",
                    },
                    {
                      label: "rotate",
                      kind: monaco.languages.CompletionItemKind.Function,
                      insertText: "rotate([${1:x}, ${2:y}, ${3:z}])",
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                      documentation: "Rotate object around axes",
                    },
                    {
                      label: "union",
                      kind: monaco.languages.CompletionItemKind.Function,
                      insertText: "union() {\n\t${1:// objects}\n}",
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                      documentation: "Union of multiple objects",
                    },
                    {
                      label: "sphere",
                      kind: monaco.languages.CompletionItemKind.Function,
                      insertText: "sphere(r = ${1:radius});",
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                      documentation: "Create a sphere with radius",
                    },
                    {
                      label: "cube",
                      kind: monaco.languages.CompletionItemKind.Function,
                      insertText:
                        "cube([${1:width}, ${2:height}, ${3:depth}]);",
                      insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet,
                      documentation: "Create a cube with dimensions",
                    },
                  ];
                  return { suggestions };
                },
              });

              monaco.languages.setMonarchTokensProvider("openscad", {
                keywords: [
                  "module",
                  "function",
                  "if",
                  "else",
                  "for",
                  "let",
                  "each",
                  "true",
                  "false",
                  "undef",
                  "union",
                  "difference",
                  "intersection",
                  "translate",
                  "rotate",
                  "scale",
                  "mirror",
                  "multmatrix",
                  "color",
                  "offset",
                  "hull",
                  "minkowski",
                  "resize",
                  "cylinder",
                  "sphere",
                  "cube",
                  "polyhedron",
                  "square",
                  "circle",
                  "polygon",
                  "text",
                  "surface",
                  "projection",
                  "linear_extrude",
                  "rotate_extrude",
                  "import",
                  "use",
                  "include",
                ],
                operators: [
                  "=",
                  "+",
                  "-",
                  "*",
                  "/",
                  "%",
                  "!",
                  "&",
                  "|",
                  "^",
                  "~",
                  "<",
                  ">",
                  "?",
                  ":",
                  "==",
                  "!=",
                  "<=",
                  ">=",
                  "&&",
                  "||",
                  "++",
                  "--",
                  "+=",
                  "-=",
                  "*=",
                  "/=",
                  "%=",
                  "&=",
                  "|=",
                  "^=",
                  "<<",
                  ">>",
                  ">>>",
                  "<<=",
                  ">>=",
                  ">>>=",
                ],
                symbols: /[=><!~?:&|+\-*\/\^%]+/,
                tokenizer: {
                  root: [
                    [
                      /[a-z_$][\w$]*/,
                      {
                        cases: {
                          "@keywords": "keyword",
                          "@default": "identifier",
                        },
                      },
                    ],
                    [/[A-Z][\w\$]*/, "type.identifier"],
                    { include: "@whitespace" },
                    [/[{}()\[\]]/, "@brackets"],
                    [/[<>](?!@symbols)/, "@brackets"],
                    [
                      /@symbols/,
                      {
                        cases: {
                          "@operators": "operator",
                          "@default": "",
                        },
                      },
                    ],
                    [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
                    [/\d+/, "number"],
                    [/[;,.]/, "delimiter"],
                    [/"([^"\\]|\\.)*$/, "string.invalid"],
                    [
                      /"/,
                      {
                        token: "string.quote",
                        bracket: "@open",
                        next: "@string",
                      },
                    ],
                    [/'([^'\\]|\\.)*$/, "string.invalid"],
                    [
                      /'/,
                      {
                        token: "string.quote",
                        bracket: "@open",
                        next: "@string_single",
                      },
                    ],
                    [
                      /`/,
                      {
                        token: "string.quote",
                        bracket: "@open",
                        next: "@string_backtick",
                      },
                    ],
                  ],
                  whitespace: [
                    [/[ \t\r\n]+/, "white"],
                    [/\/\*/, "comment", "@comment"],
                    [/\/\/.*$/, "comment"],
                  ],
                  comment: [
                    [/[^\/*]+/, "comment"],
                    [/\*\//, "comment", "@pop"],
                    [/[\/*]/, "comment"],
                  ],
                  string: [
                    [/[^\\"]+/, "string"],
                    [
                      /"/,
                      {
                        token: "string.quote",
                        bracket: "@close",
                        next: "@pop",
                      },
                    ],
                  ],
                  string_single: [
                    [/[^\\']+/, "string"],
                    [
                      /'/,
                      {
                        token: "string.quote",
                        bracket: "@close",
                        next: "@pop",
                      },
                    ],
                  ],
                  string_backtick: [
                    [/[^\\`]+/, "string"],
                    [
                      /`/,
                      {
                        token: "string.quote",
                        bracket: "@close",
                        next: "@pop",
                      },
                    ],
                  ],
                },
              });
            }}
          />
        </div>

        <div className="mt-4 text-gray-400 text-sm">
          <p>
            <strong>Supported operations:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              Variables: <code>name = value;</code>
            </li>
            <li>
              Cylinders: <code>cylinder(h = height, r = radius);</code>
            </li>
            <li>
              Translation: <code>translate([x, y, z])</code>
            </li>
            <li>
              Rotation: <code>rotate([x, y, z])</code>
            </li>
            <li>
              Curved cylinders:{" "}
              <code>
                curved_cylinder(start = [x1, y1, z1], end = [x2, y2, z2], r =
                radius);
              </code>
            </li>
            <li>
              Union: <code>union() &#123; ... &#125;</code>
            </li>
          </ul>
        </div>
      </div>

      {/* 3D Preview */}
      <div className="w-1/2 p-4 bg-gray-900">
        <h3 className="text-white text-lg font-semibold mb-4">
          Real-time Preview
        </h3>
        <div className="h-96 bg-gray-800 rounded">
          <Canvas
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
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
            <pointLight position={[0, 0, 10]} intensity={0.6} color="#ffffff" />

            {/* Render OpenSCAD geometry */}
            {geometry && <primitive object={geometry} />}

            {/* Grid for reference */}
            <gridHelper args={[100, 20, 0x444444, 0x222222]} />
          </Canvas>
        </div>

        <div className="mt-4 text-gray-400 text-sm">
          <p>
            <strong>Preview Controls:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Left click + drag: Rotate view</li>
            <li>Right click + drag: Pan view</li>
            <li>Scroll: Zoom in/out</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OpenSCADEditor;
