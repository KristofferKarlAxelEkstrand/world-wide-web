// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig({
	root,
	build: {
		outDir,
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				about: resolve(__dirname, 'about.html'),
				css_toggle: resolve(__dirname, 'src/css_toggle/index.html'),
				square_grid: resolve(__dirname, 'src/square_grid/index.html'),
				products: resolve(__dirname, 'src/products/index.html'),
			},
		},
	},
	server: {
		open: true,
	},
});
