/*
	ThreeQuery.js
	-------------

	First take on a jQuery-like query system for Three.js objects.
*/

// imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeQueryResult from './ThreeQueryResult.js';
import ThreeQueryEvent from './ThreeQueryEvent.js';

/**
 * Main class
 */
class ThreeQuery {

	/**
	 * Constructors new ThreeQuery system
	 * 
	 * @param {scene} scene - the ThreeJS scene
	 * @param {renderer} renderer - the ThreeJS renderer (optional)
	 * @param {camera} camera - the ThreeJS camera (optional)
	 */
	constructor(scene, renderer, camera) {

		// save our scene
		this.scene = scene;

		// when we parse the scene & when we import geometries, we will
		// map IDs and Classes to objects with these maps
		this.idMap = new Map();
		this.classMap = new Map();

		// threeJS loaders for different types of objects
		this.loaders = new Map();

		// things for our event handling system
		// Internal event registry: eventType → object → callback[]
		this.eventRegistry = new Map();

		// save the mouse position for raycasting
		this.mouse = { x: 0, y: 0 };

		// we'll store the last raycast results here to avoid recalculating them
		this.raycastCache = { frame: -1, x: null, y: null, results: [] };
		this.lastIntersections = new Set();
		this.frameCount = 0;

		// we'll need these for raycasting, but are optional if user doesn't want events
		this.renderer = null;
		this.camera = null;

		// scan our initial scene for IDs and class names
		this.scan(scene);

		// Optional renderer/camera
		if (renderer) this.setRenderer(renderer);
		if (camera) this.setCamera(camera);

		// make sure this is bound to our instance
		this.$ = this.$.bind(this);
	}


	/**
	 * Sets the renderer of an ThreeJS set up, so we can use it for events
	 * 
	 * @param {Renderer} renderer - the ThreeJS renderer to specify canvas to use for events
	 */
	setRenderer(renderer) {

		// save the renderer and its canvas
		this.renderer = renderer;
		const canvas = renderer.domElement;

		// Bind and store handlers
		this._boundMouseMove = (e) => {

			// calculate & save the mouse position relative to the canvas
			const rect = canvas.getBoundingClientRect();
			this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

			// true if we have any mouse events registered that need raycasting
			const needsRaycast =
				this.eventRegistry.has('mousemove') ||
				this.eventRegistry.has('mouseenter') ||
				this.eventRegistry.has('mouseleave');

			if (needsRaycast)
				this._handleMouseEvent('mousemove', e);
		};

		// bind all the events to the canvas we'll need for our event system
		canvas.addEventListener('mousemove', this._boundMouseMove);
		this._boundEvents = {};
		['click', 'dblclick', 'mousedown', 'mouseup', 'wheel'].forEach(eventType => {
			this._boundEvents[eventType] = (e) => this._handleMouseEvent(eventType, e);
			canvas.addEventListener(eventType, this._boundEvents[eventType]);
		});
	}


	/**
	 * Sets the camera used for event raycasting.
	 * 
	 * @param {THREE.Camera} camera 
	 */
	setCamera(camera) {
		this.camera = camera;
	}


	/**
	 * Add a loader we can use for format types
	 * 
	 * @param {String} type - type
	 * @param {Function} loaderFn - loader to load & return loaded data
	 */
	addLoader(type, loaderFn) {
		this.loaders.set(type, loaderFn);
	}


	/**
	 * Loads a geometry from a given path & automatically scans it to update our maps
	 * 
	 * @param {String} type - typ to load
	 * @param {String} src - path to load
	 * @returns {Promise<Object3D>} - loaded object
	 */
	async loadGeometry(type, src) {

		// find previously prepared loader or GTFO if none created yet
		const loader = this.loaders.get(type);
		if (!loader)
			throw new Error(`No loader for type ${type}`);

		// load the object
		const obj = await loader(src);

		// update our maps with an IDs or classnames found
		this.scan(obj);
		return obj;
	}


	/**
	 * Traverses over an object / its children & updates our maps with any IDs and class names found
	 * 
	 * @param {Object3D} object - ThreeJs object (hierarchy) to scan
	 */
	scan(object) {

		// traverse the hierarchy of this object
		object.traverse(child => {

			// IDs and classnames will be stored in the userData.name field of the imported objects
			if (!child.userData.name) return;

			// parseName will break out the ID and class names from the userData.name field, if any
			const { id, classes } = ThreeQuery.parseName(child.userData.name);

			// update our ID map if we have one
			if (id) {
				if (!this.idMap.has(id))
					this.idMap.set(id, []);
				this.idMap.get(id).push(child);
			}

			// update our class map with any class names found
			for (let cls of classes) {

				if (!this.classMap.has(cls)) this.classMap.set(cls, []);
				this.classMap.get(cls).push(child);

			}// next cls

			// tell the child object about its ID and classes we parsed from the name
			child._threeQueryMeta = { id, classes: new Set(classes) };
		});
	}


	/**
	 * Parses the name of an object looking for #IDs and .class names
	 * 
	 * @param {String} name - name of an object found on an object
	 * @returns {Object} - object with id and classes
	 */
	static parseName(name) {

		// match the #ID syntax and .class names
		const idMatch = name.match(/#(\w+)/);
		const classMatches = [...name.matchAll(/\.(\w+)/g)].map(m => m[1]);

		// pack results into an object and return
		return {
			id: idMatch ? idMatch[1] : null,
			classes: classMatches || []
		};
	}


	/**
	 * The main money - a method to query for objects in the scene
	 * 
	 * @param {String|Object3D|Array<Object3D>} selector - CSS-like selector, e.g. #id .class, or Object/Objects to wrap in ThreeQueryResult
	 * @param {Object} context - OPTIONAL, the context to search in, default is the scene
	 * 
	 * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
	 */
	query(selector, context = this.scene) {

		// hard-coded case for selecting everything - just return everything in our scene
		if (selector === '*') {
			const all = [];
			context.traverse(obj => all.push(obj));
			return new ThreeQueryResult(all, this);
		}

		// if we were given a reference to an Object3D or an array of them, just wrap it in a ThreeQueryResult
		if (selector instanceof THREE.Object3D) {
			return new ThreeQueryResult([selector], this);
		}
		if (Array.isArray(selector) && selector.every(obj => obj instanceof THREE.Object3D)) {
			return new ThreeQueryResult(selector, this);
		}

		// if we found a comma in the query string, treat it as a comma-separated list of selectors
		if (typeof selector === 'string' && selector.includes(',')) {
			const parts = selector.split(',').map(s => s.trim());
			const merged = new Set();
			parts.forEach(part => {
				this.query(part, context).objects.forEach(obj => merged.add(obj));
			});
			return new ThreeQueryResult([...merged], this);
		}

		// determine if this is a descendant selector (e.g., '.hat .feather') or compound selector (e.g., '.ball.red')
		let selectors = /\s/.test(selector) ? selector.trim().split(/\s+/) : [selector.trim()];

		// perform search based on the selector parts in order
		const search = (objs, idx) => {

			// gtfo if we reached the end of selectors
			if (idx >= selectors.length)
				return objs;

			// get selector & search for it in the current set of objects
			const sel = selectors[idx];
			let next = new Set();

			// search for the selector in the current set of objects
			objs.forEach(obj => {
				obj.children.forEach(child => {
					child.traverse(descendant => {
						if (ThreeQuery.matches(descendant, sel))
							next.add(descendant);
					});
				});
			});

			return search(next, idx + 1);
		};

		// kick off the recursive search & pack results into a new ThreeQueryResult object
		return new ThreeQueryResult([...search(new Set([context]), 0)], this);
	}


	/**
	 * Method to check of a ThreeJS object matches a CSS-like selector
	 * 
	 * @param {Object3D} obj - object to check
	 * @param {String} selector - selector to match against
	 * @returns {Boolean} - true if the object matches the selector
	 */
	static matches(obj, selector) {

		// if no meta data, we can't match
		if (!obj._threeQueryMeta)
			return false;

		// get the ID and classes from the meta data
		const { id, classes } = obj._threeQueryMeta;

		// check for ID/class matches
		const idMatch = selector.match(/^#(\w+)/);
		const classMatches = [...selector.matchAll(/\.(\w+)/g)].map(m => m[1]);

		// If the selector isn't an ID or class, reject it outright
		if (!idMatch && classMatches.length === 0)
			return false;

		// if neither ID nor class matches, we don't match
		if (idMatch && id !== idMatch[1])
			return false;

		for (let cls of classMatches)
			if (!classes.has(cls))
				return false;

		// if we ran the gauntlet, we matched
		return true;
	}


	/**
	 * Short hand version of this.query
	 * 
	 * @param {String} selector - CSS-like selector
	 * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
	 */
	$(selector) {
		return this.query(selector);
	}


	/**
	 * Handle events for mouse interactions, if we have a renderer and camera set.
	 * 
	 * @param {String} eventType - the type of event to register for (e.g., 'click', 'mousemove', etc.)
	 * @param {MouseEvent} domEvent - the native DOM event to handle
	 */
	_handleMouseEvent(eventType, domEvent) {

		const canvas = this.renderer.domElement;

		// check if we have any listeners for this type of event
		// if we don't have any, we can skip raycasting
		const registry = this.eventRegistry.get(eventType);
		if ((!registry || registry.size === 0) && eventType !== 'mousemove')
			return;

		// used for preventing duplicate raycasts in the same frame
		const frame = ++this.frameCount;

		// get the mouse position over the canvas where it was last
		const { x, y } = this.mouse;

		// Use cached raycast if valid
		if (
			this.raycastCache.frame !== frame ||
			this.raycastCache.x !== x ||
			this.raycastCache.y !== y
		) {
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera({ x, y }, this.camera);

			// save the raycast results in our cache
			this.raycastCache.results = raycaster.intersectObjects(this.scene.children, true);
			this.raycastCache.frame = frame;
			this.raycastCache.x = x;
			this.raycastCache.y = y;
		}

		// Dedupe hits by object — keep first hit per object
		const seen = new Set();
		const hits = [];
		for (const hit of this.raycastCache.results) {
			if (!seen.has(hit.object)) {
				seen.add(hit.object);
				hits.push(hit);
			}
		}// next hit

		// Handle mouseenter/mouseleave (only on mousemove)
		if (eventType === 'mousemove')
			this._handleEnterLeave(hits, domEvent);

		// if we didn't get a register, we can exit now
		if (!registry || registry.size === 0)
			return;

		// Dispatch events to objects registered for this type
		for (const hit of hits) {

			// first we check if the object is registered for this event type
			const obj = hit.object;
			if (!registry.has(obj))
				continue;

			// get the list of callbacks for this object and event type or gtfo if none
			const callbacks = registry.get(obj);
			if (!callbacks)
				continue;

			// Create a new ThreeQueryEvent for this hit
			const evt = new ThreeQueryEvent({
				object: obj,
				root: this,
				originalEvent: domEvent,
				raycast: hit,
				x,
				y
			});

			// Dispatch the event to all callbacks registered for this object and event type
			for (const cb of callbacks)
				cb(evt);
		}// next hit

	}


	/**
	 * Handles mouse enter/leave events based on current raycast hits.
	 * 
	 * @param {Array} currentHits - Array of current raycast hits.
	 * @param {MouseEvent} domEvent - The original DOM event that triggered this.
	 */
	_handleEnterLeave(currentHits, domEvent) {

		// build our sets to compare
		const currentSet = new Set(currentHits.map(hit => hit.object));
		const entered = new Set();
		const left = new Set();

		// Detect entered
		for (const obj of currentSet)
			if (!this.lastIntersections.has(obj))
				entered.add(obj);
		

		// Detect left
		for (const obj of this.lastIntersections)
			if (!currentSet.has(obj))
				left.add(obj);

		// Update last state to compare to next time
		this.lastIntersections = currentSet;

		// Dispatch enter
		const enterRegistry = this.eventRegistry.get('mouseenter');
		if (enterRegistry) {

			// For each object that was entered, dispatch the event
			for (const obj of entered) {

				// Check if we have callbacks registered for this object
				const callbacks = enterRegistry.get(obj);
				if (!callbacks)
					continue;

				// Find the hit for this object in the current hits & create the event
				const hit = currentHits.find(h => h.object === obj);
				const evt = new ThreeQueryEvent({
					object: obj,
					root: this,
					originalEvent: domEvent,
					raycast: hit,
					x: this.mouse.x,
					y: this.mouse.y
				});

				// Dispatch the event to all callbacks registered for this object
				for (const cb of callbacks)
					cb(evt);

			}// next obj
		}

		// Dispatch leave
		const leaveRegistry = this.eventRegistry.get('mouseleave');
		if (leaveRegistry) {

			// For each object that was left, dispatch the event
			for (const obj of left) {

				// Check if we have callbacks registered for this object
				const callbacks = leaveRegistry.get(obj);
				if (!callbacks)
					continue;

				// Create the event for this object
				const evt = new ThreeQueryEvent({
					object: obj,
					root: this,
					originalEvent: domEvent,
					raycast: null,
					x: this.mouse.x,
					y: this.mouse.y
				});

				// Dispatch the event to all callbacks registered for this object
				for (const cb of callbacks)
					cb(evt);

			}// next obj
		}
	}

	/**
	 * Cleans up the ThreeQuery instance, removing all event listeners and clearing internal state.
	 */
	destroy() {

		// If we don't have a renderer, there's nothing to clean up
		if (!this.renderer)
			return;

		// Remove all listeners from the canvas
		const canvas = this.renderer.domElement;
		canvas.removeEventListener('mousemove', this._boundMouseMove);
		['click', 'dblclick', 'mousedown', 'mouseup', 'wheel'].forEach(eventType => {
			canvas.removeEventListener(eventType, this._boundEvents?.[eventType]);
		});

		// Clear internal references
		this.eventRegistry.clear();
		this.lastIntersections.clear();
		this.raycastCache = { frame: -1, x: null, y: null, results: [] };
		this.mouse = { x: 0, y: 0 };
		this.renderer = null;
		this._boundMouseMove = null;
		this._boundEvents = null;
	}

}


/**
 * Creates a basic Three.js scene with optional helpers.
 * 
 * @param {HTMLElement} container - DOM element to mount renderer into.
 * @param {Object} options - Optional configuration
 * @returns {Object} scene setup (scene, renderer, controls, cube, lights, etc.)
 */
ThreeQuery.createScene = function (container, {
	autoSize = true,
	autoRender = true,
	onRender = null,
	addCube = false,
	addLights = false,
	addControls = false
} = {}) {

	// Basic setup
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
	camera.position.set(0, 0, 3);

	// Mount renderer to the container
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(container.clientWidth, container.clientHeight);
	container.appendChild(renderer.domElement);

	// Resize logic
	let resizeObserver = null;
	if (autoSize) {
		const resize = () => {
			const width = container.clientWidth;
			const height = container.clientHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
			if (autoRender)
				renderer.render(scene, camera);
		};

		// Always use ResizeObserver — it's reliable
		// (as opposed to window resize)
		resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);
	}

	// Controls
	let controls = null;
	if (addControls) {
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
	}

	// Lights
	let lights = null;
	if (addLights) {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 5, 5);
		scene.add(ambientLight, directionalLight);
		lights = { ambientLight, directionalLight };
	}

	// Cube
	let cube = null;
	if (addCube) {
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshStandardMaterial({ color: 'red' });
		const object = new THREE.Mesh(geometry, material);
		object.userData.name = '#defaultCube .red .box';
		scene.add(object);
		cube = { geometry, material, object };
	}

	// Render loop
	if (autoRender) {
		function animate() {
			requestAnimationFrame(animate);
			if (onRender) onRender();
			if (controls) controls.update();
			renderer.render(scene, camera);
		}
		animate();
	}

	// Return scene components
	return {
		scene,
		renderer,
		camera,
		controls,
		cube,
		lights,
		resizeObserver
	};
};

export default ThreeQuery;
