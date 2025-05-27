class n {
  /**
   * Constructors new ThreeQuery system
   * 
   * @param {scene} scene - the ThreeJS scene
   */
  constructor(t) {
    this.scene = t, this.idMap = /* @__PURE__ */ new Map(), this.classMap = /* @__PURE__ */ new Map(), this.loaders = /* @__PURE__ */ new Map(), this.scan(t);
  }
  /**
   * Add a loader we can use for format types
   * 
   * @param {String} type - type
   * @param {Function} loaderFn - loader to load & return loaded data
   */
  addLoader(t, s) {
    this.loaders.set(t, s);
  }
  /**
   * Loads a geometry from a given path & automatically scans it to update our maps
   * 
   * @param {String} type - typ to load
   * @param {String} src - path to load
   * @returns {Promise<Object3D>} - loaded object
   */
  async loadGeometry(t, s) {
    const e = this.loaders.get(t);
    if (!e)
      throw new Error(`No loader for type ${t}`);
    const a = await e(s);
    return this.scan(a), a;
  }
  /**
   * Traverses over an object / its children & updates our maps with any IDs and class names found
   * 
   * @param {Object3D} object - ThreeJs object (hierarchy) to scan
   */
  scan(t) {
    t.traverse((s) => {
      if (!s.userData.name) return;
      const { id: e, classes: a } = n.parseName(s.userData.name);
      e && (this.idMap.has(e) || this.idMap.set(e, []), this.idMap.get(e).push(s));
      for (let r of a)
        this.classMap.has(r) || this.classMap.set(r, []), this.classMap.get(r).push(s);
      s._threeQueryMeta = { id: e, classes: new Set(a) };
    });
  }
  /**
   * Parses the name of an object looking for #IDs and .class names
   * 
   * @param {String} name - name of an object found on an object
   * @returns {Object} - object with id and classes
   */
  static parseName(t) {
    const s = t.match(/#(\w+)/), e = [...t.matchAll(/\.(\w+)/g)].map((a) => a[1]);
    return {
      id: s ? s[1] : null,
      classes: e || []
    };
  }
  /**
   * The main money - a method to query for objects in the scene
   * 
   * @param {String} selector - CSS-like selector, e.g. #id .class
   * @param {Object} context - OPTIONAL, the context to search in, default is the scene
   * 
   * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
   */
  query(t, s = this.scene) {
    const e = t.trim().split(/\s+/), a = (r, i) => {
      if (i >= e.length)
        return r;
      const h = e[i];
      let c = /* @__PURE__ */ new Set();
      return r.forEach((l) => {
        l.traverse((u) => {
          n.matches(u, h) && c.add(u);
        });
      }), a(c, i + 1);
    };
    return new o([...a(/* @__PURE__ */ new Set([s]), 0)], this);
  }
  /**
   * Method to check of a ThreeJS object matches a CSS-like selector
   * 
   * @param {Object3D} obj - object to check
   * @param {String} selector - selector to match against
   * @returns {Boolean} - true if the object matches the selector
   */
  static matches(t, s) {
    if (!t._threeQueryMeta)
      return !1;
    const { id: e, classes: a } = t._threeQueryMeta, r = s.match(/^#(\w+)/), i = [...s.matchAll(/\.(\w+)/g)].map((h) => h[1]);
    if (r && e !== r[1])
      return !1;
    for (let h of i)
      if (!a.has(h))
        return !1;
    return !0;
  }
  /**
   * Short hand version of this.query
   * 
   * @param {String} selector - CSS-like selector
   * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
   */
  $(t) {
    return this.query(t);
  }
}
class o {
  /**
   * Constructs new ThreeQueryResult object
   * 
   * @param {Array<Object3D>} objects - list of objects found in a query
   * @param {Object3D} root - Scene root
   */
  constructor(t, s) {
    this.objects = t, this.root = s;
  }
  /**
   * Iterator helper
   * 
   * @param {Function} fn - function to call for each object
   * @returns {ThreeQueryResult} - this object
   */
  each(t) {
    return this.objects.forEach(t), this;
  }
  /**
   * Searches results for a selector
   * 
   * @param {String} selector - CSS selector to search for
   * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
   */
  find(t) {
    const s = [];
    return this.objects.forEach((e) => {
      const a = this.root.query(t, e);
      s.push(...a.objects);
    }), new o(s, this.root);
  }
  /**
   * Method to apply scale to results or return the current scale
   * 
   * @param {Number} x - new x scale
   * @param {Number} y - new y scale
   * @param {Number} z - new z scale
   * @returns {Vector3|ThreeQueryResult} - this object OR the current scale if no params
   */
  scale(t, s, e) {
    var a;
    return t === void 0 ? (a = this.objects[0]) == null ? void 0 : a.scale : (this.each((r) => r.scale.set(t, s, e)), this);
  }
  /**
   * Method to apply position to results or return the current position
   * 
   * @param {Number} x - new x position
   * @param {Number} y - new y position
   * @param {Number} z - new z position
   * @returns {Vector3|ThreeQueryResult} - this object OR the current position if no params
   */
  pos(t, s, e) {
    var a;
    return t === void 0 ? (a = this.objects[0]) == null ? void 0 : a.position : (this.each((r) => r.position.set(t, s, e)), this);
  }
  /**
   * Method to apply rotation to results or return the current rotation
   * 
   * @param {Number} x - new x rotation OR quaternion
   * @param {Number} y - new y rotation
   * @param {Number} z - new z rotation
   * @returns {quaternion|ThreeQueryResult} - this object OR the current rotation if no params
   */
  rot(t, s, e) {
    var a;
    return t === void 0 ? (a = this.objects[0]) == null ? void 0 : a.rotation : (typeof t == "object" ? this.each((r) => r.quaternion.copy(t)) : this.each((r) => r.rotation.set(t, s, e)), this);
  }
  /**
   * Sets material settings or returns the current material if no params
   * 
   * @param {Object} settings - settings to apply to the material
   * @param {Boolean} applyAll - if true, apply to all materials, otherwise only the first
   * @returns {Material|ThreeQueryResult} - this object OR the current material if no params
   */
  material(t, s = !1) {
    var e;
    return t ? (this.each((a) => {
      const r = Array.isArray(a.material) ? a.material : [a.material];
      (s ? r : [r[0]]).forEach((i) => {
        Object.entries(t).forEach(([h, c]) => {
          h in i ? i[h] = c : console.warn(`Property ${h} not in material`);
        });
      });
    }), this) : (e = this.objects[0]) == null ? void 0 : e.material;
  }
  /**
   * Toggles the visibility of the objects
   * 
   * @returns {ThreeQueryResult} - this object
   */
  toggle() {
    return this.each((t) => t.visible = !t.visible), this;
  }
  /**
   * Explicitly sets the visibility of the objects or returns the current visibility if no params
   * 
   * @param {Boolean} val - true to show, false to hide
   * @returns {Boolean|ThreeQueryResult} - this object OR the current visibility if no params	
   */
  show(t) {
    var s;
    return t === void 0 ? (s = this.objects[0]) == null ? void 0 : s.visible : (this.each((e) => e.visible = t), this);
  }
  /**
   * Sets the ID of the objects or returns the current ID if no params
   * 
   * @param {String} newID - new ID to set
   * @returns {String|ThreeQueryResult} - this object OR the current ID if no params	
   */
  id(t) {
    var s, e;
    return t ? (this.each((a) => {
      var i;
      const r = a._threeQueryMeta.id;
      r && ((i = this.root.idMap.get(r)) == null || i.splice(this.root.idMap.get(r).indexOf(a), 1)), a._threeQueryMeta.id = t, a.userData.name = `#${t}`, this.root.idMap.has(t) || this.root.idMap.set(t, []), this.root.idMap.get(t).push(a);
    }), this) : (e = (s = this.objects[0]) == null ? void 0 : s._threeQueryMeta) == null ? void 0 : e.id;
  }
  /**
   * Adds a class name
   * 
   * @param {String} cls - class name
   * @returns {ThreeQueryResult} - this object
   */
  addClass(t) {
    return this.each((s) => {
      s._threeQueryMeta.classes.add(t), s.userData.name += ` .${t}`, this.root.classMap.has(t) || this.root.classMap.set(t, []), this.root.classMap.get(t).push(s);
    }), this;
  }
  /**
   * Removes class name
   * @param {String} cls - class name
   * @returns {ThreeQueryResult} - this object
   */
  removeClass(t) {
    return this.each((s) => {
      var e;
      s._threeQueryMeta.classes.delete(t), s.userData.name = s.userData.name.replace(new RegExp(`\\.${t}`), ""), (e = this.root.classMap.get(t)) == null || e.splice(this.root.classMap.get(t).indexOf(s), 1);
    }), this;
  }
  /**
   * Toggles a class name
   * 
   * @param {String} cls - class name
   * @returns {ThreeQueryResult} - this object
   */
  toggleClass(t) {
    return this.each((s) => {
      s._threeQueryMeta.classes.has(t) ? this.removeClass(t) : this.addClass(t);
    }), this;
  }
  /**
   * Gets the class names of the first object
   * 
   * @returns {Array} - array of class names
   */
  class() {
    var t, s;
    return [...((s = (t = this.objects[0]) == null ? void 0 : t._threeQueryMeta) == null ? void 0 : s.classes) || []];
  }
  /**
   * Gets or sets the parent of the objects
   * 
   * @param {Object3D} newParent - new parent object
   * @returns {Object3D|ThreeQueryResult} - this object OR the current parent if no params
   */
  parent(t) {
    var e;
    if (!t)
      return (e = this.objects[0]) == null ? void 0 : e.parent;
    const s = t instanceof o ? t.objects[0] : t;
    return this.each((a) => s.add(a)), this;
  }
  /**
   * Clones this result
   * 
   * @returns {ThreeQueryResult} - a new ThreeQueryResult object with cloned objects
   */
  clone() {
    const t = this.objects.map((s) => s.clone(!0));
    return new o(t, this.root);
  }
  /**
   * Getter for the objects in this result
   * 
   * @returns {Array} - array of objects in this result
   */
  object() {
    return this.objects;
  }
}
export {
  n as default
};
