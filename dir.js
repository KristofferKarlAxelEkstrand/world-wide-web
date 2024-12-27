import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Function to get all directories in a given path
function getDirectories(srcPath) {
	return readdirSync(srcPath).filter((file) => {
		return statSync(join(srcPath, file)).isDirectory();
	});
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, 'src');
const directories = getDirectories(srcPath);
const outputPath = resolve(__dirname, 'src/index.html');

const htmlContent = `
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/svg+xml" href="/vite.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>World Wide Web Fiddle</title>
	</head>
	<body>
		<ul>${directories
			.map(
				(dir) => `
			<li><a href="/${dir}/">${dir}</a></li>`
			)
			.join('')}
		</ul>

		<script type="module" src="/index.js"></script>
	</body>
</html>
`;

writeFileSync(outputPath, htmlContent, 'utf-8');

console.log(`Folder names have been written to ${outputPath}`);
