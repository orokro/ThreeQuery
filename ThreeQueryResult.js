/*
	ThreeQueryResult.js
	-------------------

	Results when querying the scene graph with ThreeQuery.
*/

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
		if (this.objects.length === 1)
			return this.objects[0];

		// otherwise, return the array of objects
		return this.objects;
	}


	/**
	 * Registers an event callback for each object in the result.
	 * 
	 * @param {String} eventType - The event type (e.g. 'click', 'mousemove')
	 * @param {Function} callback - Callback to invoke
	 * @returns {ThreeQueryResult} this
	 */
	on(eventType, callback) {

		const registry = this.root.eventRegistry;

		if (!registry.has(eventType))
			registry.set(eventType, new Map());

		this.objects.forEach(obj => {
			
			if (!registry.get(eventType).has(obj))
				registry.get(eventType).set(obj, new Set());

			registry.get(eventType).get(obj).add(callback);
		});

		return this;
	}

	
	/**
	 * Unregisters an event callback for each object in the result.
	 * 
	 * @param {String} eventType - The event type (e.g. 'click', 'mousemove')
	 * @param {Function} [callback] - Callback to remove; if omitted, removes all
	 * @returns {ThreeQueryResult} this
	 */
	off(eventType, callback) {

		const registry = this.root.eventRegistry;
		if (!registry.has(eventType))
			return this;

		this.objects.forEach(obj => {

			const objMap = registry.get(eventType);
			if (!objMap.has(obj))
				return;

			if (callback) {
				objMap.get(obj).delete(callback);
				if (objMap.get(obj).size === 0)
					objMap.delete(obj);

			} else {
				objMap.delete(obj);
			}
		});

		// Clean up empty maps
		if (registry.get(eventType).size === 0)
			registry.delete(eventType);

		return this;
	}

}

export default ThreeQueryResult;
