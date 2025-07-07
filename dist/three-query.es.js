import * as f from "three";
import { Controls as v, Vector3 as b, MOUSE as P, TOUCH as w, Quaternion as L, Spherical as A, Vector2 as _, Ray as Y, Plane as z, MathUtils as I } from "three";
const x = { type: "change" }, O = { type: "start" }, N = { type: "end" }, T = new Y(), k = new z(), U = Math.cos(70 * I.DEG2RAD), u = new b(), d = 2 * Math.PI, l = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, R = 1e-6;
class Z extends v {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLDOMElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = l.NONE, this.target = new b(), this.cursor = new b(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: P.ROTATE, MIDDLE: P.DOLLY, RIGHT: P.PAN }, this.touches = { ONE: w.ROTATE, TWO: w.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new b(), this._lastQuaternion = new L(), this._lastTargetPosition = new b(), this._quat = new L().setFromUnitVectors(t.up, new b(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new A(), this._sphericalDelta = new A(), this._scale = 1, this._panOffset = new b(), this._rotateStart = new _(), this._rotateEnd = new _(), this._rotateDelta = new _(), this._panStart = new _(), this._panEnd = new _(), this._panDelta = new _(), this._dollyStart = new _(), this._dollyEnd = new _(), this._dollyDelta = new _(), this._dollyDirection = new b(), this._mouse = new _(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = H.bind(this), this._onPointerDown = K.bind(this), this._onPointerUp = X.bind(this), this._onContextMenu = B.bind(this), this._onMouseWheel = q.bind(this), this._onKeyDown = Q.bind(this), this._onTouchStart = G.bind(this), this._onTouchMove = V.bind(this), this._onMouseDown = F.bind(this), this._onMouseMove = W.bind(this), this._interceptControlDown = $.bind(this), this._interceptControlUp = J.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(x), this.update(), this.state = l.NONE;
  }
  update(t = null) {
    const e = this.object.position;
    u.copy(e).sub(this.target), u.applyQuaternion(this._quat), this._spherical.setFromVector3(u), this.autoRotate && this.state === l.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let s = this.minAzimuthAngle, i = this.maxAzimuthAngle;
    isFinite(s) && isFinite(i) && (s < -Math.PI ? s += d : s > Math.PI && (s -= d), i < -Math.PI ? i += d : i > Math.PI && (i -= d), s <= i ? this._spherical.theta = Math.max(s, Math.min(i, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (s + i) / 2 ? Math.max(s, this._spherical.theta) : Math.min(i, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let o = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const h = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), o = h != this._spherical.radius;
    }
    if (u.setFromSpherical(this._spherical), u.applyQuaternion(this._quatInverse), e.copy(this.target).add(u), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let h = null;
      if (this.object.isPerspectiveCamera) {
        const r = u.length();
        h = this._clampDistance(r * this._scale);
        const n = r - h;
        this.object.position.addScaledVector(this._dollyDirection, n), this.object.updateMatrixWorld(), o = !!n;
      } else if (this.object.isOrthographicCamera) {
        const r = new b(this._mouse.x, this._mouse.y, 0);
        r.unproject(this.object);
        const n = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), o = n !== this.object.zoom;
        const c = new b(this._mouse.x, this._mouse.y, 0);
        c.unproject(this.object), this.object.position.sub(c).add(r), this.object.updateMatrixWorld(), h = u.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      h !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(h).add(this.object.position) : (T.origin.copy(this.object.position), T.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(T.direction)) < U ? this.object.lookAt(this.target) : (k.setFromNormalAndCoplanarPoint(this.object.up, this.target), T.intersectPlane(k, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const h = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), h !== this.object.zoom && (this.object.updateProjectionMatrix(), o = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, o || this._lastPosition.distanceToSquared(this.object.position) > R || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > R || this._lastTargetPosition.distanceToSquared(this.target) > R ? (this.dispatchEvent(x), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? d / 60 * this.autoRotateSpeed * t : d / 60 / 60 * this.autoRotateSpeed;
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
    u.setFromMatrixColumn(e, 0), u.multiplyScalar(-t), this._panOffset.add(u);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? u.setFromMatrixColumn(e, 1) : (u.setFromMatrixColumn(e, 0), u.crossVectors(this.object.up, u)), u.multiplyScalar(t), this._panOffset.add(u);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const s = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const i = this.object.position;
      u.copy(i).sub(this.target);
      let o = u.length();
      o *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * o / s.clientHeight, this.object.matrix), this._panUp(2 * e * o / s.clientHeight, this.object.matrix);
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
    const s = this.domElement.getBoundingClientRect(), i = t - s.left, o = e - s.top, h = s.width, r = s.height;
    this._mouse.x = i / h * 2 - 1, this._mouse.y = -(o / r) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
    this._rotateLeft(d * this._rotateDelta.x / e.clientHeight), this._rotateUp(d * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
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
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(d * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-d * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(d * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-d * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
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
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, o = Math.sqrt(s * s + i * i);
    this._dollyStart.set(0, o);
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
      const s = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + s.x), o = 0.5 * (t.pageY + s.y);
      this._rotateEnd.set(i, o);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(d * this._rotateDelta.x / e.clientHeight), this._rotateUp(d * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
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
    const e = this._getSecondPointerPosition(t), s = t.pageX - e.x, i = t.pageY - e.y, o = Math.sqrt(s * s + i * i);
    this._dollyEnd.set(0, o), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
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
    e === void 0 && (e = new _(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
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
function K(a) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(a.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(a) && (this._addPointer(a), a.pointerType === "touch" ? this._onTouchStart(a) : this._onMouseDown(a)));
}
function H(a) {
  this.enabled !== !1 && (a.pointerType === "touch" ? this._onTouchMove(a) : this._onMouseMove(a));
}
function X(a) {
  switch (this._removePointer(a), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(a.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(N), this.state = l.NONE;
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function F(a) {
  let t;
  switch (a.button) {
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
    case P.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(a), this.state = l.DOLLY;
      break;
    case P.ROTATE:
      if (a.ctrlKey || a.metaKey || a.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(a), this.state = l.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(a), this.state = l.ROTATE;
      }
      break;
    case P.PAN:
      if (a.ctrlKey || a.metaKey || a.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(a), this.state = l.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(a), this.state = l.PAN;
      }
      break;
    default:
      this.state = l.NONE;
  }
  this.state !== l.NONE && this.dispatchEvent(O);
}
function W(a) {
  switch (this.state) {
    case l.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(a);
      break;
    case l.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(a);
      break;
    case l.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(a);
      break;
  }
}
function q(a) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== l.NONE || (a.preventDefault(), this.dispatchEvent(O), this._handleMouseWheel(this._customWheelEvent(a)), this.dispatchEvent(N));
}
function Q(a) {
  this.enabled !== !1 && this._handleKeyDown(a);
}
function G(a) {
  switch (this._trackPointer(a), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case w.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(a), this.state = l.TOUCH_ROTATE;
          break;
        case w.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(a), this.state = l.TOUCH_PAN;
          break;
        default:
          this.state = l.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case w.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(a), this.state = l.TOUCH_DOLLY_PAN;
          break;
        case w.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(a), this.state = l.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = l.NONE;
      }
      break;
    default:
      this.state = l.NONE;
  }
  this.state !== l.NONE && this.dispatchEvent(O);
}
function V(a) {
  switch (this._trackPointer(a), this.state) {
    case l.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(a), this.update();
      break;
    case l.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(a), this.update();
      break;
    case l.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(a), this.update();
      break;
    case l.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(a), this.update();
      break;
    default:
      this.state = l.NONE;
  }
}
function B(a) {
  this.enabled !== !1 && a.preventDefault();
}
function $(a) {
  a.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function J(a) {
  a.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
class g {
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
    }), new g(e, this.root);
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
    return t === void 0 ? (i = this.objects[0]) == null ? void 0 : i.scale : (this.each((o) => o.scale.set(t, e, s)), this);
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
    return t === void 0 ? (i = this.objects[0]) == null ? void 0 : i.position : (this.each((o) => o.position.set(t, e, s)), this);
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
    return t === void 0 ? (i = this.objects[0]) == null ? void 0 : i.rotation : (typeof t == "object" ? this.each((o) => o.quaternion.copy(t)) : this.each((o) => o.rotation.set(t, e, s)), this);
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
      const o = Array.isArray(i.material) ? i.material : [i.material];
      (e ? o : [o[0]]).forEach((h) => {
        Object.entries(t).forEach(([r, n]) => {
          r in h ? h[r] = n : console.warn(`Property ${r} not in material`);
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
      const o = i._threeQueryMeta.id;
      o && ((h = this.root.idMap.get(o)) == null || h.splice(this.root.idMap.get(o).indexOf(i), 1)), i._threeQueryMeta.id = t, i.userData.name = `#${t}`, this.root.idMap.has(t) || this.root.idMap.set(t, []), this.root.idMap.get(t).push(i);
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
    const e = t instanceof g ? t.objects[0] : t;
    return this.each((i) => e.add(i)), this;
  }
  /**
   * Clones this result
   * 
   * @returns {ThreeQueryResult} - a new ThreeQueryResult object with cloned objects
   */
  clone() {
    const t = this.objects.map((e) => e.clone(!0));
    return new g(t, this.root);
  }
  /**
   * Getter for the objects in this result
   * 
   * @returns {Array} - array of objects in this result
   */
  object() {
    return this.objects.length === 1 ? this.objects[0] : this.objects;
  }
  /**
   * Registers an event callback for each object in the result.
   * 
   * @param {String} eventType - The event type (e.g. 'click', 'mousemove')
   * @param {Function} callback - Callback to invoke
   * @returns {ThreeQueryResult} this
   */
  on(t, e) {
    const s = this.root.eventRegistry;
    return s.has(t) || s.set(t, /* @__PURE__ */ new Map()), this.objects.forEach((i) => {
      s.get(t).has(i) || s.get(t).set(i, /* @__PURE__ */ new Set()), s.get(t).get(i).add(e);
    }), this;
  }
  /**
   * Unregisters an event callback for each object in the result.
   * 
   * @param {String} eventType - The event type (e.g. 'click', 'mousemove')
   * @param {Function} [callback] - Callback to remove; if omitted, removes all
   * @returns {ThreeQueryResult} this
   */
  off(t, e) {
    const s = this.root.eventRegistry;
    return s.has(t) ? (this.objects.forEach((i) => {
      const o = s.get(t);
      o.has(i) && (e ? (o.get(i).delete(e), o.get(i).size === 0 && o.delete(i)) : o.delete(i));
    }), s.get(t).size === 0 && s.delete(t), this) : this;
  }
}
class j {
  /**
   * Constructs a new ThreeQueryEvent object
   * 
   * @param {Object} param0 - Parameters for the event
   */
  constructor({ object: t, root: e, originalEvent: s, raycast: i, x: o, y: h }) {
    this.target = new g([t], e), this.originalEvent = s, this.raycast = i, this.time = (s == null ? void 0 : s.timeStamp) || performance.now(), this.x = o, this.y = h, this.button = (s == null ? void 0 : s.button) ?? null, this.deltaY = (s == null ? void 0 : s.deltaY) ?? null;
  }
}
class D {
  /**
   * Constructors new ThreeQuery system
   * 
   * @param {scene} scene - the ThreeJS scene
   * @param {renderer} renderer - the ThreeJS renderer (optional)
   * @param {camera} camera - the ThreeJS camera (optional)
   */
  constructor(t, e, s) {
    this.scene = t, this.idMap = /* @__PURE__ */ new Map(), this.classMap = /* @__PURE__ */ new Map(), this.loaders = /* @__PURE__ */ new Map(), this.eventRegistry = /* @__PURE__ */ new Map(), this.mouse = { x: 0, y: 0 }, this.raycastCache = { x: null, y: null, results: [] }, this.lastIntersections = /* @__PURE__ */ new Set(), this.renderer = null, this.camera = null, this.scan(t), e && this.setRenderer(e), s && this.setCamera(s), this.$ = this.$.bind(this);
  }
  /**
   * Sets the renderer of an ThreeJS set up, so we can use it for events
   * 
   * @param {Renderer} renderer - the ThreeJS renderer to specify canvas to use for events
   */
  setRenderer(t) {
    this.renderer = t;
    const e = t.domElement;
    this._boundMouseMove = (i) => {
      const o = e.getBoundingClientRect();
      this.mouse.x = (i.clientX - o.left) / o.width * 2 - 1, this.mouse.y = -((i.clientY - o.top) / o.height) * 2 + 1, (this.eventRegistry.has("mousemove") || this.eventRegistry.has("mouseenter") || this.eventRegistry.has("mouseleave")) && this._handleMouseEvent("mousemove", i);
    }, e.addEventListener("mousemove", this._boundMouseMove), this._boundEvents = {}, ["click", "dblclick", "mousedown", "mouseup", "wheel"].forEach((i) => {
      this._boundEvents[i] = (o) => this._handleMouseEvent(i, o), e.addEventListener(i, this._boundEvents[i]);
    });
    const s = t.onAfterRender;
    t.onAfterRender = () => {
      s && s(), this.raycastCache.results = [], this.raycastCache.x = null, this.raycastCache.y = null;
    };
  }
  /**
   * Sets the camera used for event raycasting.
   * 
   * @param {THREE.Camera} camera 
   */
  setCamera(t) {
    this.camera = t;
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
      const { id: s, classes: i } = D.parseName(e.userData.name);
      s && (this.idMap.has(s) || this.idMap.set(s, []), this.idMap.get(s).push(e));
      for (let o of i)
        this.classMap.has(o) || this.classMap.set(o, []), this.classMap.get(o).push(e);
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
   * @param {String|Object3D|Array<Object3D>} selector - CSS-like selector, e.g. #id .class, or Object/Objects to wrap in ThreeQueryResult
   * @param {Object} context - OPTIONAL, the context to search in, default is the scene
   * 
   * @returns {ThreeQueryResult} - a ThreeQueryResult object with the results
   */
  query(t, e = this.scene) {
    if (t === "*") {
      const o = [];
      return e.traverse((h) => o.push(h)), new g(o, this);
    }
    if (t instanceof f.Object3D)
      return new g([t], this);
    if (Array.isArray(t) && t.every((o) => o instanceof f.Object3D))
      return new g(t, this);
    if (typeof t == "string" && t.includes(",")) {
      const o = t.split(",").map((r) => r.trim()), h = /* @__PURE__ */ new Set();
      return o.forEach((r) => {
        this.query(r, e).objects.forEach((n) => h.add(n));
      }), new g([...h], this);
    }
    let s = /\s/.test(t) ? t.trim().split(/\s+/) : [t.trim()];
    const i = (o, h) => {
      if (h >= s.length)
        return o;
      const r = s[h];
      let n = /* @__PURE__ */ new Set();
      return o.forEach((c) => {
        c.children.forEach((p) => {
          p.traverse((m) => {
            D.matches(m, r) && n.add(m);
          });
        });
      }), i(n, h + 1);
    };
    return new g([...i(/* @__PURE__ */ new Set([e]), 0)], this);
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
    const { id: s, classes: i } = t._threeQueryMeta, o = e.match(/^#(\w+)/), h = [...e.matchAll(/\.(\w+)/g)].map((r) => r[1]);
    if (!o && h.length === 0 || o && s !== o[1])
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
  /**
   * Handle events for mouse interactions, if we have a renderer and camera set.
   * 
   * @param {String} eventType - the type of event to register for (e.g., 'click', 'mousemove', etc.)
   * @param {MouseEvent} domEvent - the native DOM event to handle
   */
  _handleMouseEvent(t, e) {
    this.renderer.domElement;
    const s = this.eventRegistry.get(t);
    if ((!s || s.size === 0) && t !== "mousemove")
      return;
    const { x: i, y: o } = this.mouse;
    if (this.raycastCache.x !== i || this.raycastCache.y !== o) {
      const n = new f.Raycaster();
      n.setFromCamera({ x: i, y: o }, this.camera), this.raycastCache.results = n.intersectObjects(this.scene.children, !0), this.raycastCache.x = i, this.raycastCache.y = o;
    }
    const h = /* @__PURE__ */ new Set(), r = [];
    for (const n of this.raycastCache.results)
      h.has(n.object) || (h.add(n.object), r.push(n));
    if (t === "mousemove" && this._handleEnterLeave(r, e), !(!s || s.size === 0))
      for (const n of r) {
        const c = n.object;
        if (!s.has(c))
          continue;
        const p = s.get(c);
        if (!p)
          continue;
        const m = new j({
          object: c,
          root: this,
          originalEvent: e,
          raycast: n,
          x: i,
          y: o
        });
        this._dispatchCallbacks(p, m, t);
      }
  }
  /**
   * Handles mouse enter/leave events based on current raycast hits.
   * 
   * @param {Array} currentHits - Array of current raycast hits.
   * @param {MouseEvent} domEvent - The original DOM event that triggered this.
   */
  _handleEnterLeave(t, e) {
    const s = new Set(t.map((n) => n.object)), i = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
    for (const n of s)
      this.lastIntersections.has(n) || i.add(n);
    for (const n of this.lastIntersections)
      s.has(n) || o.add(n);
    this.lastIntersections = s;
    const h = this.eventRegistry.get("mouseenter");
    if (h)
      for (const n of i) {
        const c = h.get(n);
        if (!c)
          continue;
        const p = t.find((S) => S.object === n), m = new j({
          object: n,
          root: this,
          originalEvent: e,
          raycast: p,
          x: this.mouse.x,
          y: this.mouse.y
        });
        this._dispatchCallbacks(c, m, "mouseenter");
      }
    const r = this.eventRegistry.get("mouseleave");
    if (r)
      for (const n of o) {
        const c = r.get(n);
        if (!c)
          continue;
        const p = new j({
          object: n,
          root: this,
          originalEvent: e,
          raycast: null,
          x: this.mouse.x,
          y: this.mouse.y
        });
        this._dispatchCallbacks(c, p, "mouseleave");
      }
  }
  /**
   * Dispatches callbacks for a given event type.
   * 
   * @param {Set<Function>} callbacks - set of callbacks
   * @param {ThreeQueryEvent} evt - event object to dispatch
   * @param {String} type - type of event (e.g., 'click', 'mousemove', etc.)
   */
  _dispatchCallbacks(t, e, s) {
    for (const i of t)
      try {
        i(e);
      } catch (o) {
        console.error(`ThreeQuery: error in ${s} callback:`, o);
      }
  }
  /**
   * Cleans up the ThreeQuery instance, removing all event listeners and clearing internal state.
   */
  destroy() {
    if (!this.renderer)
      return;
    const t = this.renderer.domElement;
    t.removeEventListener("mousemove", this._boundMouseMove), ["click", "dblclick", "mousedown", "mouseup", "wheel"].forEach((e) => {
      var s;
      t.removeEventListener(e, (s = this._boundEvents) == null ? void 0 : s[e]);
    }), this.eventRegistry.clear(), this.lastIntersections.clear(), this.raycastCache = { x: null, y: null, results: [] }, this.mouse = { x: 0, y: 0 }, this.renderer = null, this._boundMouseMove = null, this._boundEvents = null;
  }
}
D.createScene = function(a, t = {}) {
  const e = new f.Scene();
  return D.useScene(e, a, t);
};
D.useScene = function(a, t, {
  autoSize: e = !0,
  autoRender: s = !0,
  onRender: i = null,
  addCube: o = !1,
  addLights: h = !1,
  addControls: r = !1
} = {}) {
  const n = new f.PerspectiveCamera(75, t.clientWidth / t.clientHeight, 0.1, 1e3);
  n.position.set(0, 0, 3);
  const c = new f.WebGLRenderer({ antialias: !0 });
  c.setSize(t.clientWidth, t.clientHeight), t.appendChild(c.domElement);
  let p = null;
  if (e) {
    const y = () => {
      const E = t.clientWidth, M = t.clientHeight;
      n.aspect = E / M, n.updateProjectionMatrix(), c.setSize(E, M), s && c.render(a, n);
    };
    p = new ResizeObserver(y), p.observe(t);
  }
  let m = null;
  r && (m = new Z(n, c.domElement), m.enableDamping = !0);
  let S = null;
  if (h) {
    const y = new f.AmbientLight(16777215, 0.6), E = new f.DirectionalLight(16777215, 0.8);
    E.position.set(5, 5, 5), a.add(y, E), S = { ambientLight: y, directionalLight: E };
  }
  let C = null;
  if (o) {
    const y = new f.BoxGeometry(), E = new f.MeshStandardMaterial({ color: "red" }), M = new f.Mesh(y, E);
    M.userData.name = "#defaultCube .red .box", a.add(M), C = { geometry: y, material: E, object: M };
  }
  if (s) {
    let y = function() {
      requestAnimationFrame(y), i && i(), m && m.update(), c.render(a, n);
    };
    y();
  }
  return {
    scene: a,
    renderer: c,
    camera: n,
    controls: m,
    cube: C,
    lights: S,
    resizeObserver: p
  };
};
export {
  D as default
};
