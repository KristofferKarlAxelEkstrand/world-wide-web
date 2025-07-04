import { dir } from 'console';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

function getDirectories(srcPath) {
	return readdirSync(srcPath)
		.filter((file) => statSync(join(srcPath, file)).isDirectory())
		.filter((dir) => dir !== '_copy')
		.map((dir) => {
			let data = { path: dir };
			const dirPath = join(srcPath, dir);
			const infoPath = join(dirPath, 'info.json');

			let jsonData = {};

			try {
				const json = readFileSync(infoPath, 'utf-8');
				jsonData = JSON.parse(json);
			} catch (error) {
				console.error(`Error reading or parsing ${infoPath}:`, error);
			}

			return { ...data, ...jsonData };
		});
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, 'src');
const directories = getDirectories(srcPath);
const outputFilePath = resolve(__dirname, 'src/index.html');

const htmlContent = `
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/svg+xml" href="/vite.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>World Wide Web - A bunch of experiments</title>
	</head>
	<body>
		<header>
			<img src="/img/www.png" alt="Let's share what we know - World Wide Web" />
			<p>This is my personal playground for experimenting with front-end development. From animations to web technologies and APIs, it's a space where I tinker, test, and explore. Think of it like demos for songs—some things are polished and ready to use, others are rough ideas or starting points. Sometimes you'll find something you can take straight as it is, and sometimes it's just a seed for what you can build. If you enjoy diving into the nitty-gritty of web development and don't mind a bit of trial and error, you're in the right place. Let's figure out the web together.</p>
		</header>
		<main>
			<ul>${directories
				.map(
					(dir) => `
				<li>
					<a href="/${dir.path}/">
						<h2>${dir.name ? dir.name : dir.path}</h2>
						<p>${dir.description ? dir.description : 'No description available'}</p>
					</a>
				</li>`
				)
				.join('')}
			</ul>
		</main>
		<script type="module" src="/index.js"></script>
	</body>
</html>
`;

writeFileSync(outputFilePath, htmlContent, 'utf-8');
