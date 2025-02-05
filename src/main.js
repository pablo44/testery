import './style.css' 
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Create a scene
const scene = new THREE.Scene();

// Set up a camera with perspective view
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Create the renderer and add it to the DOM
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.render(scene, camera);

// Add ambient and directional light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 1).normalize();
scene.add(directionalLight);

// Create procedural checkerboard floor
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      float checkSize = 5.0;
      vec2 pos = floor(vUv * checkSize);
      if (mod(pos.x + pos.y, 2.0) < 1.0)
        gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
      else
        gl_FragColor = vec4(0.8, 0.8, 0.8, 1.0);
    }
  `
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

// Camera positioning
camera.position.set(3, 3, 5);
camera.lookAt(0, 0, 0);

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

// Deformation function with safety check
function deformModelX(amount, model) {
  if (!model) return;

  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const positionAttribute = child.geometry.attributes.position;
      if (!child.geometry.attributes.originalPosition) {
        child.geometry.setAttribute(
          'originalPosition',
          new THREE.BufferAttribute(positionAttribute.array.slice(), 3)
        );
      }
      const originalPositionAttribute = child.geometry.attributes.originalPosition;
      const positions = positionAttribute.array;
      const originalPositions = originalPositionAttribute.array;

      for (let i = 0; i < positions.length; i += 3) {
        const maxDisplacement = 0.5;
        const displacement = positions[i] - originalPositions[i];

        if (Math.abs(displacement + amount) <= maxDisplacement) {
          positions[i] += amount;
        }
      }
      positionAttribute.needsUpdate = true;
    }
  });
}

// Reset deformation
function resetDeformation(model) {
  if (!model) return;

  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const positionAttribute = child.geometry.attributes.position;
      const originalPositionAttribute = child.geometry.attributes.originalPosition;
      if (!originalPositionAttribute) return;

      const positions = positionAttribute.array;
      const originalPositions = originalPositionAttribute.array;

      for (let i = 0; i < positions.length; i++) {
        positions[i] = originalPositions[i];
      }
      positionAttribute.needsUpdate = true;
    }
  });
}

// Load a 3D model (GLB format)
const loader = new GLTFLoader();
let model;

// Use correct path to the model
const modelUrl = '/models/couch_model.glb';

loader.load(
  modelUrl,
  function (gltf) {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.y = 0.5;
    scene.add(model);
  },
  undefined,
  function (error) {
    console.error('Error loading model:', error);
  }
);

// Zoom functionality
window.addEventListener('wheel', (event) => {
  camera.position.z += event.deltaY > 0 ? 0.05 : -0.05;
  camera.lookAt(0, 0, 0);
});

// Raycaster logic for deformation
window.addEventListener('click', () => {
  if (model) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
      deformModelX(0.1, model);
    }
  }
});

// Reset deformation on "R" key press
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resetDeformation(model);
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();