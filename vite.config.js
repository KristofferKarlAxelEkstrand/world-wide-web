import { resolve } from 'path';
import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'fs';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

function getDirectories(srcPath) {
	return readdirSync(srcPath).filter((file) => statSync(resolve(srcPath, file)).isDirectory());
}

const input = {
	main: resolve(__dirname, 'src/index.html'),
};

getDirectories(root).forEach((dir) => {
	const htmlFilePath = resolve(root, dir, 'index.html');
	input[dir] = htmlFilePath;
});

export default defineConfig({
	root,
	publicDir: resolve(__dirname, 'public'),
	build: {
		outDir,
		emptyOutDir: true,
		rollupOptions: {
			input,
		},
	},
	server: {
		open: true,
	},
});
