/*
	ThreeQueryEvent.js
	------------------

	The event object returned by our event system.
*/

// imports
import ThreeQueryResult from "./ThreeQueryResult";

/*
	The main money - this is the event object that gets returned when our custom events are fired
*/
class ThreeQueryEvent {

	/**
	 * Constructs a new ThreeQueryEvent object
	 * 
	 * @param {Object} param0 - Parameters for the event
	 */
	constructor({ object, root, originalEvent, raycast, x, y }) {

		// we'll wrap the object in a ThreeQueryResult to allow chaining
		this.target = new ThreeQueryResult([object], root);

		// Save Native DOM event
		this.originalEvent = originalEvent;			
		
		// Raycast result (full hit entry)
		this.raycast = raycast;								

		// save the time
		this.time = originalEvent?.timeStamp || performance.now();

		// save mouse position
		this.x = x;											// canvas-local x
		this.y = y;											// canvas-local y

		// Button and wheel info (if applicable)
		this.button = originalEvent?.button ?? null;
		this.deltaY = originalEvent?.deltaY ?? null;
	}

}

export default ThreeQueryEvent;
