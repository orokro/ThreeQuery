import * as y from "three";
import { Controls as N, Vector3 as m, MOUSE as M, TOUCH as E, Quaternion as A, Spherical as L, Vector2 as u, Ray as Y, Plane as z, MathUtils as U } from "three";
const C = { type: "change" }, O = { type: "start" }, k = { type: "end" }, T = new Y(), x = new z(), I = Math.cos(70 * U.DEG2RAD), l = new m(), p = 2 * Math.PI, n = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, S = 1e-6;
class Z extends N {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLDOMElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = n.NONE, this.target = new m(), this.cursor = new m(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: M.ROTATE, MIDDLE: M.DOLLY, RIGHT: M.PAN }, this.touches = { ONE: E.ROTATE, TWO: E.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new m(), this._lastQuaternion = new A(), this._lastTargetPosition = new m(), this._quat = new A().setFromUnitVectors(t.up, new m(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new L(), this._sphericalDelta = new L(), this._scale = 1, this._panOffset = new m(), this._rotateStart = new u(), this._rotateEnd = new u(), this._rotateDelta = new u(), this._panStart = new u(), this._panEnd = new u(), this._panDelta = new u(), this._dollyStart = new u(), this._dollyEnd = new u(), this._dollyDelta = new u(), this._dollyDirection = new m(), this._mouse = new u(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = K.bind(this), this._onPointerDown = v.bind(this), this._onPointerUp = H.bind(this), this._onContextMenu = V.bind(this), this._onMouseWheel = W.bind(this), this._onKeyDown = q.bind(this), this._onTouchStart = Q.bind(this), this._onTouchMove = G.bind(this), this._onMouseDown = X.bind(this), this._onMouseMove = F.bind(this), this._interceptControlDown = B.bind(this), this._interceptControlUp = $.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
  }
  connect(t) {
    super.connect(t), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
  }
  dispose() {
    this.disconnect();
  }
  /**
   * Get the current vertical rotation, in radians.
   *
   * @return {number} The current vertical rotation, in radians.
   */
  getPolarAngle() {
    return this._spherical.phi;
  }
  /**
   * Get the current horizontal rotation, in radians.
   *
   * @return {number} The current horizontal rotation, in radians.
   */
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  /**
   * Returns the distance from the camera to the target.
   *
   * @return {number} The distance from the camera to the target.
   */
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  /**
   * Adds key event listeners to the given DOM element.
   * `window` is a recommended argument for using this method.
   *
   * @param {HTMLDOMElement} domElement - The DOM element
   */
  listenToKeyEvents(t) {
    t.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = t;
  }
  /**
   * Removes the key event listener previously defined with `listenToKeyEvents()`.
   */
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  /**
   * Save the current state of the controls. This can later be recovered with `reset()`.
   */
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  /**
   * Reset the controls to their state from either the last time the `saveState()`
   * was called, or the initial state.
   */
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(C), this.update(), this.state = n.NONE;
  }
  update(t = null) {
    const e = this.object.position;
    l.copy(e).sub(this.target), l.applyQuaternion(this._quat), this._spherical.setFromVector3(l), this.autoRotate && this.state === n.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, i = this.maxAzimuthAngle;
    isFinite(s) && isFinite(i) && (s < -Math.PI ? s += p : s > Math.PI && (s -= p), i < -Math.PI ? i += p : i > Math.PI && (i -= p), s <= i ? this._spherical.theta = Math.max(s, Math.min(i, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + i) / 2 ? Math.max(s, this._spherical.theta) : Math.min(i, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let a = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const h = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), a = h != this._spherical.radius;
    }
    if (l.setFromSpherical(this._spherical), l.applyQuaternion(this._quatInverse), e.copy(this.target).add(l), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let h = null;
      if (this.object.isPerspectiveCamera) {
        const r = l.length();
        h = this._clampDistance(r * this._scale);
        const c = r - h;
        this.object.position.addScaledVector(this._dollyDirection, c), this.object.updateMatrixWorld(), a = !!c;
      } else if (this.object.isOrthographicCamera) {
        const r = new m(this._mouse.x, this._mouse.y, 0);
        r.unproject(this.object);
        const c = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), a = c !== this.object.zoom;
        const d = new m(this._mouse.x, this._mouse.y, 0);
        d.unproject(this.object), this.object.position.sub(d).add(r), this.object.updateMatrixWorld(), h = l.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      h !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position) : (T.origin.copy(this.object.position), T.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(T.direction)) < I ? this.object.lookAt(this.target) : (x.setFromNormalAndCoplanarPoint(this.object.up, this.target), T.intersectPlane(x, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const h = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), h !== this.object.zoom && (this.object.updateProjectionMatrix(), a = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, a || this._lastPosition.distanceToSquared(this.object.position) > S || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > S || this._lastTargetPosition.distanceToSquared(this.target) > S ? (this.dispatchEvent(C), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? p / 60 * this.autoRotateSpeed * t : p / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(t) {
    const e = Math.abs(t * 0.01);
    return Math.pow(0.95, this.zoomSpeed * e);
  }
  _rotateLeft(t) {
    this._sphericalDelta.theta -= t;
  }
  _rotateUp(t) {
    this._sphericalDelta.phi -= t;
  }
  _panLeft(t, e) {
    l.setFromMatrixColumn(e, 0), l.multiplyScalar(-t), this._panOffset.add(l);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? l.setFromMatrixColumn(e, 1) : (l.setFromMatrixColumn(e, 0), l.crossVectors(this.object.up, l)), l.multiplyScalar(t), this._panOffset.add(l);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const s = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const i = this.object.position;
      l.copy(i).sub(this.target);
      let a = l.length();
      a *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * a / s.clientHeight, this.object.matrix), this._panUp(2 * e * a / s.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / s.clientWidth, this.object.matrix), this._panUp(e * (this.object.top - this.object.bottom) / this.object.zoom / s.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(t, e) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const s = this.domElement.getBoundingClientRect(), i = t - s.left, a = e - s.top, h = s.width, r = s.height;
    this._mouse.x = i / h * 2 - 1, this._mouse.y = -(a / r) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(t) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, t));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(t) {
    this._rotateStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownDolly(t) {
    this._updateZoomParameters(t.clientX, t.clientX), this._dollyStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownPan(t) {
    this._panStart.set(t.clientX, t.clientY);
  }
  _handleMouseMoveRotate(t) {
    this._rotateEnd.set(t.clientX, t.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(p * this._rotateDelta.x / e.clientHeight), this._rotateUp(p * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(t) {
    this._dollyEnd.set(t.clientX, t.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  _handleMouseMovePan(t) {
    this._panEnd.set(t.clientX, t.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(t) {
    this._updateZoomParameters(t.clientX, t.clientY), t.deltaY < 0 ? this._dollyIn(this._getZoomScale(t.deltaY)) : t.deltaY > 0 && this._dollyOut(this._getZoomScale(t.deltaY)), this.update();
  }
  _handleKeyDown(t) {
    let e = !1;
    switch (t.code) {
      case this.keys.UP:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(p * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-p * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(p * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-p * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
        break;
    }
    e && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + e.x), i = 0.5 * (t.pageY + e.y);
      this._rotateStart.set(s, i);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + e.x), i = 0.5 * (t.pageY + e.y);
      this._panStart.set(s, i);
    }
  }
  _handleTouchStartDolly(t) {
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, a = Math.sqrt(s * s + i * i);
    this._dollyStart.set(0, a);
  }
  _handleTouchStartDollyPan(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enablePan && this._handleTouchStartPan(t);
  }
  _handleTouchStartDollyRotate(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enableRotate && this._handleTouchStartRotate(t);
  }
  _handleTouchMoveRotate(t) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(t.pageX, t.pageY);
    else {
      const s = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + s.x), a = 0.5 * (t.pageY + s.y);
      this._rotateEnd.set(i, a);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(p * this._rotateDelta.x / e.clientHeight), this._rotateUp(p * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + e.x), i = 0.5 * (t.pageY + e.y);
      this._panEnd.set(s, i);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, a = Math.sqrt(s * s + i * i);
    this._dollyEnd.set(0, a), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const h = (t.pageX + e.x) * 0.5, r = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(h, r);
  }
  _handleTouchMoveDollyPan(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enablePan && this._handleTouchMovePan(t);
  }
  _handleTouchMoveDollyRotate(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enableRotate && this._handleTouchMoveRotate(t);
  }
  // pointers
  _addPointer(t) {
    this._pointers.push(t.pointerId);
  }
  _removePointer(t) {
    delete this._pointerPositions[t.pointerId];
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) {
        this._pointers.splice(e, 1);
        return;
      }
  }
  _isTrackingPointer(t) {
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) return !0;
    return !1;
  }
  _trackPointer(t) {
    let e = this._pointerPositions[t.pointerId];
    e === void 0 && (e = new u(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const e = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[e];
  }
  //
  _customWheelEvent(t) {
    const e = t.deltaMode, s = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (e) {
      case 1:
        s.deltaY *= 16;
        break;
      case 2:
        s.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (s.deltaY *= 10), s;
  }
}
function v(o) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(o.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(o) && (this._addPointer(o), o.pointerType === "touch" ? this._onTouchStart(o) : this._onMouseDown(o)));
}
function K(o) {
  this.enabled !== !1 && (o.pointerType === "touch" ? this._onTouchMove(o) : this._onMouseMove(o));
}
function H(o) {
  switch (this._removePointer(o), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(o.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(k), this.state = n.NONE;
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function X(o) {
  let t;
  switch (o.button) {
    case 0:
      t = this.mouseButtons.LEFT;
      break;
    case 1:
      t = this.mouseButtons.MIDDLE;
      break;
    case 2:
      t = this.mouseButtons.RIGHT;
      break;
    default:
      t = -1;
  }
  switch (t) {
    case M.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(o), this.state = n.DOLLY;
      break;
    case M.ROTATE:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = n.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = n.ROTATE;
      }
      break;
    case M.PAN:
      if (o.ctrlKey || o.metaKey || o.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(o), this.state = n.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(o), this.state = n.PAN;
      }
      break;
    default:
      this.state = n.NONE;
  }
  this.state !== n.NONE && this.dispatchEvent(O);
}
function F(o) {
  switch (this.state) {
    case n.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(o);
      break;
    case n.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(o);
      break;
    case n.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(o);
      break;
  }
}
function W(o) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== n.NONE || (o.preventDefault(), this.dispatchEvent(O), this._handleMouseWheel(this._customWheelEvent(o)), this.dispatchEvent(k));
}
function q(o) {
  this.enabled !== !1 && this._handleKeyDown(o);
}
function Q(o) {
  switch (this._trackPointer(o), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case E.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(o), this.state = n.TOUCH_ROTATE;
          break;
        case E.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(o), this.state = n.TOUCH_PAN;
          break;
        default:
          this.state = n.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case E.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(o), this.state = n.TOUCH_DOLLY_PAN;
          break;
        case E.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(o), this.state = n.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = n.NONE;
      }
      break;
    default:
      this.state = n.NONE;
  }
  this.state !== n.NONE && this.dispatchEvent(O);
}
function G(o) {
  switch (this._trackPointer(o), this.state) {
    case n.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(o), this.update();
      break;
    case n.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(o), this.update();
      break;
    case n.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(o), this.update();
      break;
    case n.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(o), this.update();
      break;
    default:
      this.state = n.NONE;
  }
}
function V(o) {
  this.enabled !== !1 && o.preventDefault();
}
function B(o) {
  o.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function $(o) {
  o.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
class w {
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
  addLoader(t, e) {
    this.loaders.set(t, e);
  }
  /**
   * Loads a geometry from a given path & automatically scans it to update our maps
   * 
   * @param {String} type - typ to load
   * @param {String} src - path to load
   * @returns {Promise<Object3D>} - loaded object
   */
  async loadGeometry(t, e) {
    const s = this.loaders.get(t);
    if (!s)
      throw new Error(`No loader for type ${t}`);
    const i = await s(e);
    return this.scan(i), i;
  }
  /**
   * Traverses over an object / its children & updates our maps with any IDs and class names found
   * 
   * @param {Object3D} object - ThreeJs object (hierarchy) to scan
   */
  scan(t) {
    t.traverse((e) => {
      if (!e.userData.name) return;
      const { id: s, classes: i } = w.parseName(e.userData.name);
      s && (this.idMap.has(s) || this.idMap.set(s, []), this.idMap.get(s).push(e));
      for (let a of i)
        this.classMap.has(a) || this.classMap.set(a, []), this.classMap.get(a).push(e);
      e._threeQueryMeta = { id: s, classes: new Set(i) };
    });
  }
  /**
   * Parses the name of an object looking for #IDs and .class names
   * 
   * @param {String} name - name of an object found on an object
   * @returns {Object} - object with id and classes
   */
  static parseName(t) {
    const e = t.match(/#(\w+)/), s = [...t.matchAll(/\.(\w+)/g)].map((i) => i[1]);
    return {
      id: e ? e[1] : null,
      classes: s || []
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
  query(t, e = this.scene) {
    const s = t.trim().split(/\s+/), i = (a, h) => {
      if (h >= s.length)
        return a;
      const r = s[h];
      let c = /* @__PURE__ */ new Set();
      return a.forEach((d) => {
        d.traverse((b) => {
          w.matches(b, r) && c.add(b);
        });
      }), i(c, h + 1);
    };
    return new D([...i(/* @__PURE__ */ new Set([e]), 0)], this);
  }
  /**
   * Method to check of a ThreeJS object matches a CSS-like selector
   * 
   * @param {Object3D} obj - object to check
   * @param {String} selector - selector to match against
   * @returns {Boolean} - true if the object matches the selector
   */
  static matches(t, e) {
    if (!t._threeQueryMeta)
      return !1;
    const { id: s, classes: i } = t._threeQueryMeta, a = e.match(/^#(\w+)/), h = [...e.matchAll(/\.(\w+)/g)].map((r) => r[1]);
    if (a && s !== a[1])
      return !1;
    for (let r of h)
      if (!i.has(r))
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
class D {
  /**
   * Constructs new ThreeQueryResult object
   * 
   * @param {Array<Object3D>} objects - list of objects found in a query
   * @param {Object3D} root - Scene root
   */
  constructor(t, e) {
    this.objects = t, this.root = e;
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
    const e = [];
    return this.objects.forEach((s) => {
      const i = this.root.query(t, s);
      e.push(...i.objects);
    }), new D(e, this.root);
  }
  /**
   * Method to apply scale to results or return the current scale
   * 
   * @param {Number} x - new x scale
   * @param {Number} y - new y scale
   * @param {Number} z - new z scale
   * @returns {Vector3|ThreeQueryResult} - this object OR the current scale if no params
   */
  scale(t, e, s) {
    var i;
    return t === void 0 ? (i = this.objects[0]) == null ? void 0 : i.scale : (this.each((a) => a.scale.set(t, e, s)), this);
  }
  /**
   * Method to apply position to results or return the current position
   * 
   * @param {Number} x - new x position
   * @param {Number} y - new y position
   * @param {Number} z - new z position
   * @returns {Vector3|ThreeQueryResult} - this object OR the current position if no params
   */
  pos(t, e, s) {
    var i;
    return t === void 0 ? (i = this.objects[0]) == null ? void 0 : i.position : (this.each((a) => a.position.set(t, e, s)), this);
  }
  /**
   * Method to apply rotation to results or return the current rotation
   * 
   * @param {Number} x - new x rotation OR quaternion
   * @param {Number} y - new y rotation
   * @param {Number} z - new z rotation
   * @returns {quaternion|ThreeQueryResult} - this object OR the current rotation if no params
   */
  rot(t, e, s) {
    var i;
    return t === void 0 ? (i = this.objects[0]) == null ? void 0 : i.rotation : (typeof t == "object" ? this.each((a) => a.quaternion.copy(t)) : this.each((a) => a.rotation.set(t, e, s)), this);
  }
  /**
   * Sets material settings or returns the current material if no params
   * 
   * @param {Object} settings - settings to apply to the material
   * @param {Boolean} applyAll - if true, apply to all materials, otherwise only the first
   * @returns {Material|ThreeQueryResult} - this object OR the current material if no params
   */
  material(t, e = !1) {
    var s;
    return t ? (this.each((i) => {
      const a = Array.isArray(i.material) ? i.material : [i.material];
      (e ? a : [a[0]]).forEach((h) => {
        Object.entries(t).forEach(([r, c]) => {
          r in h ? h[r] = c : console.warn(`Property ${r} not in material`);
        });
      });
    }), this) : (s = this.objects[0]) == null ? void 0 : s.material;
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
    var e;
    return t === void 0 ? (e = this.objects[0]) == null ? void 0 : e.visible : (this.each((s) => s.visible = t), this);
  }
  /**
   * Sets the ID of the objects or returns the current ID if no params
   * 
   * @param {String} newID - new ID to set
   * @returns {String|ThreeQueryResult} - this object OR the current ID if no params	
   */
  id(t) {
    var e, s;
    return t ? (this.each((i) => {
      var h;
      const a = i._threeQueryMeta.id;
      a && ((h = this.root.idMap.get(a)) == null || h.splice(this.root.idMap.get(a).indexOf(i), 1)), i._threeQueryMeta.id = t, i.userData.name = `#${t}`, this.root.idMap.has(t) || this.root.idMap.set(t, []), this.root.idMap.get(t).push(i);
    }), this) : (s = (e = this.objects[0]) == null ? void 0 : e._threeQueryMeta) == null ? void 0 : s.id;
  }
  /**
   * Adds a class name
   * 
   * @param {String} cls - class name
   * @returns {ThreeQueryResult} - this object
   */
  addClass(t) {
    return this.each((e) => {
      e._threeQueryMeta.classes.add(t), e.userData.name += ` .${t}`, this.root.classMap.has(t) || this.root.classMap.set(t, []), this.root.classMap.get(t).push(e);
    }), this;
  }
  /**
   * Removes class name
   * @param {String} cls - class name
   * @returns {ThreeQueryResult} - this object
   */
  removeClass(t) {
    return this.each((e) => {
      var s;
      e._threeQueryMeta.classes.delete(t), e.userData.name = e.userData.name.replace(new RegExp(`\\.${t}`), ""), (s = this.root.classMap.get(t)) == null || s.splice(this.root.classMap.get(t).indexOf(e), 1);
    }), this;
  }
  /**
   * Toggles a class name
   * 
   * @param {String} cls - class name
   * @returns {ThreeQueryResult} - this object
   */
  toggleClass(t) {
    return this.each((e) => {
      e._threeQueryMeta.classes.has(t) ? this.removeClass(t) : this.addClass(t);
    }), this;
  }
  /**
   * Gets the class names of the first object
   * 
   * @returns {Array} - array of class names
   */
  class() {
    var t, e;
    return [...((e = (t = this.objects[0]) == null ? void 0 : t._threeQueryMeta) == null ? void 0 : e.classes) || []];
  }
  /**
   * Gets or sets the parent of the objects
   * 
   * @param {Object3D} newParent - new parent object
   * @returns {Object3D|ThreeQueryResult} - this object OR the current parent if no params
   */
  parent(t) {
    var s;
    if (!t)
      return (s = this.objects[0]) == null ? void 0 : s.parent;
    const e = t instanceof D ? t.objects[0] : t;
    return this.each((i) => e.add(i)), this;
  }
  /**
   * Clones this result
   * 
   * @returns {ThreeQueryResult} - a new ThreeQueryResult object with cloned objects
   */
  clone() {
    const t = this.objects.map((e) => e.clone(!0));
    return new D(t, this.root);
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
w.createScene = function(o, {
  autoSize: t = !0,
  autoRender: e = !0,
  onRender: s = null,
  addCube: i = !1,
  addLights: a = !1,
  addControls: h = !1
} = {}) {
  const r = new y.Scene(), c = new y.PerspectiveCamera(75, o.clientWidth / o.clientHeight, 0.1, 1e3);
  c.position.set(2, 2, 3);
  const d = new y.WebGLRenderer({ antialias: !0 });
  d.setSize(o.clientWidth, o.clientHeight), o.appendChild(d.domElement);
  let b = null;
  if (t) {
    const _ = () => {
      const f = o.clientWidth, g = o.clientHeight;
      c.aspect = f / g, c.updateProjectionMatrix(), d.setSize(f, g), e && d.render(r, c);
    };
    b = new ResizeObserver(_), b.observe(o);
  }
  let P = null;
  h && (P = new Z(c, d.domElement), P.enableDamping = !0);
  let R = null;
  if (a) {
    const _ = new y.AmbientLight(16777215, 0.6), f = new y.DirectionalLight(16777215, 0.8);
    f.position.set(5, 5, 5), r.add(_, f), R = { ambientLight: _, directionalLight: f };
  }
  let j = null;
  if (i) {
    const _ = new y.BoxGeometry(), f = new y.MeshStandardMaterial({ color: "red" }), g = new y.Mesh(_, f);
    g.userData.name = "#defaultCube .red .box", r.add(g), j = { geometry: _, material: f, object: g };
  }
  if (e) {
    let _ = function() {
      requestAnimationFrame(_), s && s(), P && P.update(), d.render(r, c);
    };
    _();
  }
  return {
    scene: r,
    renderer: d,
    camera: c,
    controls: P,
    cube: j,
    lights: R,
    resizeObserver: b
  };
};
export {
  w as default
};
