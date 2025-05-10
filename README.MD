# 🎯 ThreeQuery

**ThreeQuery** is a jQuery-inspired selector and utility library for [Three.js](https://threejs.org), making it easier to load, query, and manipulate 3D objects in your scene using CSS-like syntax.

Built for developers and artists working with tools like Blender, it lets you attach selectors (`#id`, `.class`) to object names and control them in a fluent, chainable, and expressive way — just like jQuery, but in 3D.

---

## 🚀 Features

- Query Three.js objects using CSS-style selectors (`#id`, `.class1.class2`)
- Chain methods to manipulate objects (`.scale()`, `.material()`, `.pos()`, etc.)
- Auto-index scene on load and keep internal maps in sync
- Support for custom geometry loaders (`gltf`, `fbx`, etc.)
- Dynamic `.addClass()`, `.removeClass()`, `.toggleClass()`, and `.id()` methods
- Traverse and filter using `.find()` and `.each()`

---

## 📦 Installation

Clone or copy the file into your project:

```bash
npm install three
```

```js
// ThreeQuery.js - Drop this in your src directory
import ThreeQuery from './ThreeQuery.js';
```

---

## 🧠 Scene Setup (Blender Naming Convention)

In Blender (or when authoring in code), assign object names like:

```
#player .enemy .characters
```

Or:

```
.bigBall#ball.playersObjects
```

ThreeQuery will parse names using:
- `#id` → unique object ID
- `.className` → class-like tag
- Multiple IDs/classes can be combined in any order

---

## ✨ Usage

### 📋 Basic Setup

```js
import ThreeQuery from './ThreeQuery.js';

const $ = new ThreeQuery(scene);
```

---

### 📁 Add Custom Loaders

```js
$.addLoader('fbx', async (filePath) => {
	const loader = new FBXLoader();
	const obj = await loader.loadAsync(filePath);
	return obj;
});
```

### 📦 Load & Auto-Scan Geometry

```js
const obj = await $.loadGeometry('fbx', '/models/enemy.fbx');
scene.add(obj);
```

---

## 🔎 Selectors

```js
$('#player')           // Object with ID 'player'
$('.enemy')            // All objects with class 'enemy'
'#boss.enemy.bosses'   // ID with multiple class constraints
'#player .hat'         // Finds .hat under #player
'.team .character'     // Nested descendant search
```

---

## 🔧 Methods

### 🔁 Traversal

| Method            | Description |
|------------------|-------------|
| `.each(fn)`       | Iterates over all results |
| `.find(selector)` | Finds matching children recursively |
| `.object()`       | Returns raw Three.js objects |

---

### 📐 Transform Helpers

| Method             | Usage |
|-------------------|-------|
| `.pos(x, y, z)`     | Sets position |
| `.pos()`            | Gets position of first result |
| `.rot(x, y, z)`     | Sets rotation in Euler |
| `.rot(quat)`        | Sets rotation using quaternion |
| `.rot()`            | Gets rotation |
| `.scale(x, y, z)`   | Sets scale |
| `.scale()`          | Gets scale |

---

### 🎨 Materials

| Method                            | Description |
|----------------------------------|-------------|
| `.material(props, applyAll)`     | Set material properties (color, opacity, etc.) |
| `.material()`                    | Get material(s) of first object |

```js
$('.enemy').material({ color: '#ff0000', opacity: 0.5 });
```

---

### 👀 Visibility

| Method        | Description |
|---------------|-------------|
| `.toggle()`   | Toggle visibility |
| `.show(true)` | Show |
| `.show(false)`| Hide |
| `.show()`     | Get visibility of first object |

---

### 🏷 ID & Class Management

| Method                  | Description |
|-------------------------|-------------|
| `.id()`                 | Get ID of first result |
| `.id('newId')`          | Set new ID |
| `.class()`              | Get class list of first object |
| `.addClass(name)`       | Add class |
| `.removeClass(name)`    | Remove class |
| `.toggleClass(name)`    | Toggle class on/off |

---

### 🌲 Scene Graph

| Method                  | Description |
|-------------------------|-------------|
| `.parent()`             | Get parent of first object |
| `.parent(obj)`          | Set parent |
| `.clone()`              | Clone objects |
| `.object()`             | Get raw Three.js objects |

---

## 📌 Example

```js
import ThreeQuery from './ThreeQuery.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const $ = new ThreeQuery(scene);

// Setup loader
$.addLoader('fbx', async (path) => {
	const loader = new FBXLoader();
	return loader.loadAsync(path);
});

// Load and add to scene
const obj = await $.loadGeometry('fbx', 'models/char.fbx');
scene.add(obj);

// Select and manipulate
$('.enemy')
  .find('.hat')
  .scale(1.5, 1.5, 1.5)
  .material({ color: 0xff0000 });

$('#boss')
  .pos(10, 0, 5)
  .toggle();
```

---

## ⚙️ Internals

Objects are tracked using `userData.name` (or `name` if `userData.name` is empty), parsed for:
- `#id`
- `.class1.class2`

Matching results are wrapped in a `ThreeQueryResult` object that allows jQuery-style method chaining and consistent state sync between the scene and your selectors.

---

## 📣 TODO

- Support advanced CSS selectors (`>`, `:not()`, etc.)
- Event-based API (`.on('click')`)
- TypeScript typings
- Plugin support
- NPM release

---

## 📃 License

MIT — open for all to use and extend.

---

## 🤝 Contributions

PRs, issues, and suggestions are welcome! Help turn ThreeQuery into the 3D DOM utility we all want.
