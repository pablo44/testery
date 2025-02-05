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