import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//scene set up

const scene = new THREE.Scene();

//create pespective Camera

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000

);

//renderer as a DOM element

const renderer= new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.render(scene, camera);

//ambient light and directional light

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 1).normalize();
scene.add(directionalLight);

//flool chekboard patern floor using template literas to implement GLSL code as a string(procedural texture)

const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  ,
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
floor. position.y = -0.5;
scene.add(floor);

//setting camera pos and making camera looking at the user no one else

camera.position.set(3, 3, 5);
camera.lookAt(0, 0, 0);

//raycaster for mouse

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (event.clientY/ window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove, false);


//model deformation func includin specific model construction made of ffew meshes

function DeformModelX(amount, model) {
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

//deformation canceling with "r" keyboard

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

//loading a model of a couch

const loader = new GLTFLoader();
let model;

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
    console.error('Errorloading model:', error);
  }
);

//zooming the scene

