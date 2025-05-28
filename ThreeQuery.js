/*
	ThreeQuery.js
	-------------

	First take on a jQuery-like query system for Three.js objects.
*/

// imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


/**
 * Main class
 */
class ThreeQuery {

	/**
	 * Constructors new ThreeQuery system
	 * 
	 * @param {scene} scene - the ThreeJS scene
	 */
	constructor(scene) {

		// save our scene
		this.scene = scene;

		// when we parse the scene & when we import geometries, we will
		// map IDs and Classes to objects with these maps
		this.idMap = new Map();
		this.classMap = new Map();

		// threeJS loaders for different types of objects
		this.loaders = new Map();

		// scan our initial scene for IDs and class names
		this.scan(scene);

		// make sure this is bound to our instance
		this.$ = this.$.bind(this);
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

			// get all the parts of the selector, trim them, and merge results from each part
			const parts = selector.split(',').map(s => s.trim());
			const merged = new Set();

			// recursively query each part and merge results into a single set
			parts.forEach(part => {
				this.query(part, context).objects.forEach(obj => merged.add(obj));
			});
			return new ThreeQueryResult([...merged], this);
		}
	
		// build a set of results as we search
		let results = new Set();
		const selectors = selector.trim().split(/\s+/);
	
		// perform search based on the selectors parts in order
		const search = (objs, idx) => {

			// gtfo if we reached the end of selectors
			if (idx >= selectors.length)
				return objs;
	
			// get selector & search for it in the current set of objects
			const sel = selectors[idx];
			let next = new Set();
	
			// search for the selector in the current set of objects
			objs.forEach(obj => {
				obj.traverse(child => {
					if (ThreeQuery.matches(child, sel))
						next.add(child);
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
}


/**
 * Results for a ThreeQuery query, with added functionality for manipulating & changing the results
 */
class ThreeQueryResult {

	/**
	 * Constructs new ThreeQueryResult object
	 * 
	 * @param {Array<Object3D>} objects - list of objects found in a query
	 * @param {Object3D} root - Scene root
	 */
	constructor(objects, root) {
		this.objects = objects;
		this.root = root;
	}


	/**
	 * Iterator helper
	 * 
	 * @param {Function} fn - function to call for each object
	 * @returns {ThreeQueryResult} - this object
	 */
	each(fn) {
		this.objects.forEach(fn);
		return this;
	}


	/**
	 * Searches results for a selector
	 * 
	 * @param {String} selector - CSS selector to search for
	 * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
	 */
	find(selector) {

		const found = [];
		this.objects.forEach(obj => {
			const res = this.root.query(selector, obj);
			found.push(...res.objects);
		});

		// technically a new result, so return that
		return new ThreeQueryResult(found, this.root);
	}


	/**
	 * Method to apply scale to results or return the current scale
	 * 
	 * @param {Number} x - new x scale
	 * @param {Number} y - new y scale
	 * @param {Number} z - new z scale
	 * @returns {Vector3|ThreeQueryResult} - this object OR the current scale if no params
	 */
	scale(x, y, z) {

		// return scale if no params (this acts as a getter)
		if (x === undefined)
			return this.objects[0]?.scale;

		this.each(o => o.scale.set(x, y, z));
		return this;
	}


	/**
	 * Method to apply position to results or return the current position
	 * 
	 * @param {Number} x - new x position
	 * @param {Number} y - new y position
	 * @param {Number} z - new z position
	 * @returns {Vector3|ThreeQueryResult} - this object OR the current position if no params
	 */
	pos(x, y, z) {

		// return position if no params (this acts as a getter)
		if (x === undefined)
			return this.objects[0]?.position;

		this.each(o => o.position.set(x, y, z));
		return this;
	}


	/**
	 * Method to apply rotation to results or return the current rotation
	 * 
	 * @param {Number} x - new x rotation OR quaternion
	 * @param {Number} y - new y rotation
	 * @param {Number} z - new z rotation
	 * @returns {quaternion|ThreeQueryResult} - this object OR the current rotation if no params
	 */
	rot(x, y, z) {

		// return rotation if no params (this acts as a getter)
		if (x === undefined)
			return this.objects[0]?.rotation;

		// apply quaternion if x is an object
		if (typeof x === 'object')
			this.each(o => o.quaternion.copy(x));

		// otherwise, set the rotation in Euler angles
		else
			this.each(o => o.rotation.set(x, y, z));

		return this;
	}


	/**
	 * Sets material settings or returns the current material if no params
	 * 
	 * @param {Object} settings - settings to apply to the material
	 * @param {Boolean} applyAll - if true, apply to all materials, otherwise only the first
	 * @returns {Material|ThreeQueryResult} - this object OR the current material if no params
	 */
	material(settings, applyAll = false) {

		// return material if no params (this acts as a getter)
		if (!settings)
			return this.objects[0]?.material;

		// apply settings to the material
		this.each(obj => {

			const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
			(applyAll ? mats : [mats[0]]).forEach(mat => {
				Object.entries(settings).forEach(([k, v]) => {
					if (k in mat) mat[k] = v;
					else console.warn(`Property ${k} not in material`);
				});
			});
		});

		return this;
	}


	/**
	 * Toggles the visibility of the objects
	 * 
	 * @returns {ThreeQueryResult} - this object
	 */
	toggle() {
		this.each(o => o.visible = !o.visible);
		return this;
	}


	/**
	 * Explicitly sets the visibility of the objects or returns the current visibility if no params
	 * 
	 * @param {Boolean} val - true to show, false to hide
	 * @returns {Boolean|ThreeQueryResult} - this object OR the current visibility if no params	
	 */
	show(val) {

		// return visibility if no params (this acts as a getter)
		if (val === undefined)
			return this.objects[0]?.visible;

		// set visibility for all objects
		this.each(o => o.visible = val);
		return this;
	}


	/**
	 * Sets the ID of the objects or returns the current ID if no params
	 * 
	 * @param {String} newID - new ID to set
	 * @returns {String|ThreeQueryResult} - this object OR the current ID if no params	
	 */
	id(newID) {

		// return ID if no params (this acts as a getter)
		if (!newID)
			return this.objects[0]?._threeQueryMeta?.id;

		// set the ID for all objects
		this.each(obj => {

			const old = obj._threeQueryMeta.id;
			if (old)
				this.root.idMap.get(old)?.splice(this.root.idMap.get(old).indexOf(obj), 1);
			
			obj._threeQueryMeta.id = newID;
			obj.userData.name = `#${newID}`;

			if (!this.root.idMap.has(newID))
				this.root.idMap.set(newID, []);

			this.root.idMap.get(newID).push(obj);
		});

		return this;
	}


	/**
	 * Adds a class name
	 * 
	 * @param {String} cls - class name
	 * @returns {ThreeQueryResult} - this object
	 */
	addClass(cls) {
		this.each(obj => {
			obj._threeQueryMeta.classes.add(cls);
			obj.userData.name += ` .${cls}`;
			if (!this.root.classMap.has(cls)) this.root.classMap.set(cls, []);
			this.root.classMap.get(cls).push(obj);
		});
		return this;
	}


	/**
	 * Removes class name
	 * @param {String} cls - class name
	 * @returns {ThreeQueryResult} - this object
	 */
	removeClass(cls) {

		this.each(obj => {
			obj._threeQueryMeta.classes.delete(cls);
			obj.userData.name = obj.userData.name.replace(new RegExp(`\\.${cls}`), '');
			this.root.classMap.get(cls)?.splice(this.root.classMap.get(cls).indexOf(obj), 1);
		});
		return this;
	}


	/**
	 * Toggles a class name
	 * 
	 * @param {String} cls - class name
	 * @returns {ThreeQueryResult} - this object
	 */
	toggleClass(cls) {

		this.each(obj => {
			if (obj._threeQueryMeta.classes.has(cls)) this.removeClass(cls);
			else this.addClass(cls);
		});
		return this;
	}


	/**
	 * Gets the class names of the first object
	 * 
	 * @returns {Array} - array of class names
	 */
	class() {
		return [...this.objects[0]?._threeQueryMeta?.classes || []];
	}
	

	/**
	 * Gets or sets the parent of the objects
	 * 
	 * @param {Object3D} newParent - new parent object
	 * @returns {Object3D|ThreeQueryResult} - this object OR the current parent if no params
	 */
	parent(newParent) {

		// return parent if no params (this acts as a getter)
		if (!newParent)
			return this.objects[0]?.parent;

		// NOTE: todo, change this to use the parent of the first object
		const rawParent = newParent instanceof ThreeQueryResult ? newParent.objects[0] : newParent;
		this.each(obj => rawParent.add(obj));
		return this;
	}


	/**
	 * Clones this result
	 * 
	 * @returns {ThreeQueryResult} - a new ThreeQueryResult object with cloned objects
	 */
	clone() {

		// clone the objects and return a new ThreeQueryResult object
		const clones = this.objects.map(o => o.clone(true));
		return new ThreeQueryResult(clones, this.root);
	}


	/**
	 * Getter for the objects in this result
	 * 
	 * @returns {Array} - array of objects in this result
	 */
	object() {

		// if we only have one object, return it directly
		if(this.objects.length === 1)
			return this.objects[0];

		// otherwise, return the array of objects
		return this.objects;
	}
}

/**
 * Creates a basic Three.js scene with optional helpers.
 * 
 * @param {HTMLElement} container - DOM element to mount renderer into.
 * @param {Object} options - Optional configuration
 * @returns {Object} scene setup (scene, renderer, controls, cube, lights, etc.)
 */
ThreeQuery.createScene = function(container, {
		autoSize = true,
		autoRender = true,
		onRender = null,
		addCube = false,
		addLights = false,
		addControls = false
	} = {}){

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
			if (autoRender) renderer.render(scene, camera);
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
