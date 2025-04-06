/*
	ThreeQuery.js
	-------------

	First take on a jQuery-like query system for Three.js objects.
*/

class ThreeQuery {
	constructor(scene) {
		this.scene = scene;
		this.idMap = new Map();
		this.classMap = new Map();
		this.loaders = new Map();
		this.scan(scene);
	}

	addLoaded(type, loaderFn) {
		this.loaders.set(type, loaderFn);
	}

	async loadGeometry(type, src) {
		const loader = this.loaders.get(type);
		if (!loader) throw new Error(`No loader for type ${type}`);
		const obj = await loader(src);
		this.scan(obj);
		return obj;
	}

	scan(object) {
		object.traverse(child => {
			if (!child.userData.name) return;
			const { id, classes } = ThreeQuery.parseName(child.userData.name);
			if (id) {
				if (!this.idMap.has(id)) this.idMap.set(id, []);
				this.idMap.get(id).push(child);
			}
			for (let cls of classes) {
				if (!this.classMap.has(cls)) this.classMap.set(cls, []);
				this.classMap.get(cls).push(child);
			}
			child._threeQueryMeta = { id, classes: new Set(classes) };
		});
	}

	static parseName(name) {
		const idMatch = name.match(/#(\w+)/);
		const classMatches = [...name.matchAll(/\.(\w+)/g)].map(m => m[1]);
		return {
			id: idMatch ? idMatch[1] : null,
			classes: classMatches || []
		};
	}

	query(selector, context = this.scene) {
		let results = new Set();

		const selectors = selector.trim().split(/\s+/);
		const search = (objs, idx) => {
			if (idx >= selectors.length) return objs;
			const sel = selectors[idx];
			let next = new Set();

			objs.forEach(obj => {
				obj.traverse(child => {
					if (ThreeQuery.matches(child, sel)) {
						next.add(child);
					}
				});
			});

			return search(next, idx + 1);
		};

		return new ThreeQueryResult([...search(new Set([context]), 0)], this);
	}

	static matches(obj, selector) {
		if (!obj._threeQueryMeta) return false;
		const { id, classes } = obj._threeQueryMeta;
		const idMatch = selector.match(/^#(\w+)/);
		const classMatches = [...selector.matchAll(/\.(\w+)/g)].map(m => m[1]);

		if (idMatch && id !== idMatch[1]) return false;
		for (let cls of classMatches) {
			if (!classes.has(cls)) return false;
		}
		return true;
	}

	$(selector) {
		return this.query(selector);
	}
}

class ThreeQueryResult {
	constructor(objects, root) {
		this.objects = objects;
		this.root = root;
	}

	each(fn) {
		this.objects.forEach(fn);
		return this;
	}

	find(selector) {
		const found = [];
		this.objects.forEach(obj => {
			const res = this.root.query(selector, obj);
			found.push(...res.objects);
		});
		return new ThreeQueryResult(found, this.root);
	}

	scale(x, y, z) {
		if (x === undefined) return this.objects[0]?.scale;
		this.each(o => o.scale.set(x, y, z));
		return this;
	}

	pos(x, y, z) {
		if (x === undefined) return this.objects[0]?.position;
		this.each(o => o.position.set(x, y, z));
		return this;
	}

	rot(x, y, z) {
		if (x === undefined) return this.objects[0]?.rotation;
		if (typeof x === 'object') this.each(o => o.quaternion.copy(x));
		else this.each(o => o.rotation.set(x, y, z));
		return this;
	}

	material(settings, applyAll = false) {
		if (!settings) return this.objects[0]?.material;
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

	toggle() {
		this.each(o => o.visible = !o.visible);
		return this;
	}

	show(val) {
		if (val === undefined) return this.objects[0]?.visible;
		this.each(o => o.visible = val);
		return this;
	}

	id(newID) {
		if (!newID) return this.objects[0]?._threeQueryMeta?.id;
		this.each(obj => {
			const old = obj._threeQueryMeta.id;
			if (old) {
				this.root.idMap.get(old)?.splice(this.root.idMap.get(old).indexOf(obj), 1);
			}
			obj._threeQueryMeta.id = newID;
			obj.userData.name = `#${newID}`;
			if (!this.root.idMap.has(newID)) this.root.idMap.set(newID, []);
			this.root.idMap.get(newID).push(obj);
		});
		return this;
	}

	addClass(cls) {
		this.each(obj => {
			obj._threeQueryMeta.classes.add(cls);
			obj.userData.name += ` .${cls}`;
			if (!this.root.classMap.has(cls)) this.root.classMap.set(cls, []);
			this.root.classMap.get(cls).push(obj);
		});
		return this;
	}

	removeClass(cls) {
		this.each(obj => {
			obj._threeQueryMeta.classes.delete(cls);
			obj.userData.name = obj.userData.name.replace(new RegExp(`\\.${cls}`), '');
			this.root.classMap.get(cls)?.splice(this.root.classMap.get(cls).indexOf(obj), 1);
		});
		return this;
	}

	toggleClass(cls) {
		this.each(obj => {
			if (obj._threeQueryMeta.classes.has(cls)) this.removeClass(cls);
			else this.addClass(cls);
		});
		return this;
	}

	class() {
		return [...this.objects[0]?._threeQueryMeta?.classes || []];
	}

	parent(newParent) {
		if (!newParent) return this.objects[0]?.parent;
		const rawParent = newParent instanceof ThreeQueryResult ? newParent.objects[0] : newParent;
		this.each(obj => rawParent.add(obj));
		return this;
	}

	clone() {
		const clones = this.objects.map(o => o.clone(true));
		return new ThreeQueryResult(clones, this.root);
	}

	object() {
		return this.objects;
	}
}

export default ThreeQuery;
