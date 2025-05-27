/*
	demo.js
	-------

	Build a demo scene to show off ThreeQuery's capabilities.
*/

// imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeQuery from '../dist/three-query.es.js'; // Or CDN if testing published version

/**
 * Makes a ThreeJS scene & adds a red cube with ThreeQuery.
 */
function buildScene() {

	// build the scene & a camera
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(2, 2, 3);

	// mount renderer to our document
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('app').appendChild(renderer.domElement);

	// set up pan/rotate controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;

	// add some basic lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(5, 5, 5);
	scene.add(directionalLight);

	// for now we'll start with just a cube
	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshStandardMaterial({ color: 'red' });
	const cube = new THREE.Mesh(geometry, material);
	cube.userData.name = '#myCube .red .box';
	scene.add(cube);

	// nice
	const tq = new ThreeQuery(scene);
	console.log('Query result:', tq.$('.box').object());

	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}

	animate();
}

buildScene();
