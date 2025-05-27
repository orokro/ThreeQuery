/*
	demo.js
	-------

	Build a demo scene to show off ThreeQuery's capabilities.
*/

import ThreeQuery from '../dist/three-query.es.js';

// Get the mount point
const container = document.getElementById('app');

// Use the new helper to create the scene
const { scene } = ThreeQuery.createScene(container, {
	autoSize: true,
	autoRender: true,
	addCube: true,
	addLights: true,
	addControls: true,
});

// Make a ThreeQuery instance from that scene
const tq = new ThreeQuery(scene);

// Test query
console.log('Query result:', tq.$('.box').object());
