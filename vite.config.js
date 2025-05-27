/*
	vite.config.js
	--------------

*/

// imports
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({

	build: {

		lib: {

			entry: path.resolve(__dirname, 'ThreeQuery.js'),
			name: 'ThreeQuery',
			fileName: (format) => {

				// Optional: give UMD build a custom filename
				if (format === 'umd')
					return 'three-query.global.js';

				return `three-query.${format}.js`;
			},

			// Add UMD for <script> support
			formats: ['es', 'cjs', 'umd'],
		},

		rollupOptions: {

			external: ['three'],
			output: {
				globals: {

					// window.THREE when using <script src="three.js">
					three: 'THREE' 
				}
			}
		}
	}

});
