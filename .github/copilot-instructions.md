# World Wide Web - Front-end Development Playground

This is a Vite-based collection of front-end development experiments and demos. Each experiment showcases different web technologies, animations, APIs, and interactive components.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build the Repository

Run these commands in sequence to set up the development environment:

- `npm install` -- installs dependencies in ~5 seconds. NEVER CANCEL.
- `npm run build` -- builds all experiments for production in ~2 seconds. NEVER CANCEL.

### Development Workflow

- Start development server: `npm run dev` -- starts in ~200ms and opens http://localhost:5173/
- Format code: `npm run format` -- runs Prettier formatting in ~1.5 seconds. NEVER CANCEL.
- Compile SCSS: `npm run watch:scss` -- starts SASS compiler in watch mode. Press Ctrl+C to stop.
- Generate main page: `npm run start-page` -- regenerates src/index.html from experiment directories in ~200ms.

### Build Times and Timeouts

- **npm install**: ~8 seconds (fresh install). Set timeout to 60+ seconds.
- **npm run build**: ~1.4 seconds. Set timeout to 30+ seconds.
- **npm run format**: ~1.5 seconds. Set timeout to 30+ seconds.
- **npm run dev**: ~190ms startup. Set timeout to 30+ seconds.
- **npm run start-page**: ~200ms. Set timeout to 30+ seconds.

## Validation and Testing

### Manual Validation Requirements

ALWAYS manually validate changes through the browser since no automated testing framework exists:

1. **Start the development server**: `npm run dev`
2. **Navigate to http://localhost:5173/** and verify the main page loads with experiment cards
3. **Test experiment functionality**: Click on at least 2-3 experiment cards to ensure they load properly
4. **Interactive validation**: For experiments with controls (like Theremin, Wuug), verify interactive elements respond correctly
5. **Format validation**: Run `npm run format` before committing to ensure code formatting is consistent

### Key Validation Scenarios

After making changes, ALWAYS test these scenarios:

- **Main page generation**: Verify the homepage shows all experiments with correct titles and descriptions
- **Experiment navigation**: Click experiment cards and ensure pages load without errors
- **Interactive experiments**: Test Theremin (audio controls), Wuug (synthesizer), canvas animations
- **Responsive behavior**: Check experiments work on different screen sizes
- **Build validation**: Run `npm run build` and verify dist/ folder is generated successfully

## Project Structure and Navigation

### Repository Organization

```
src/
├── index.html          # Auto-generated main page (do not edit directly)
├── index.js           # Main page scripts
├── style.css/scss     # Global styles
├── _copy/             # Template directory for new experiments
└── {experiment-name}/ # Individual experiment directories
    ├── index.html     # Experiment page
    ├── script.js      # Experiment JavaScript
    ├── styles.css     # Experiment styles (or styles.scss)
    ├── info.json      # Experiment metadata
    └── js/            # Additional JS modules (if needed)
```

### Important Files and Locations

- **dir.js**: Script that auto-generates src/index.html from experiment directories. Run via `npm run start-page`.
- **vite.config.js**: Vite build configuration that handles multi-page builds for each experiment.
- **src/\_copy/**: Template directory - copy this to create new experiments.
- **src/index.html**: Auto-generated homepage - NEVER edit directly, it gets overwritten by dir.js.
- **.prettierrc**: Code formatting configuration used by `npm run format`.

### Creating New Experiments

1. Copy the `src/_copy/` directory to `src/{new-experiment-name}/`
2. Update `info.json` with experiment name, description, and version
3. Modify `index.html`, `script.js`, and `styles.css` for your experiment
4. Run `npm run start-page` to regenerate the main page with your new experiment
5. Test via `npm run dev` and navigate to http://localhost:5173/{new-experiment-name}/

## Build and Deployment

### Production Build

- `npm run build` -- builds all experiments into dist/ directory
- Output includes optimized HTML, CSS, and JavaScript for each experiment
- Build artifacts are stored in dist/ and ready for deployment
- Takes ~2 seconds to complete

### Code Quality

- `npm run format` -- formats all code using Prettier with project-specific rules
- No linting beyond Prettier exists in this project
- ALWAYS run formatting before committing changes

### File Management Best Practices

- **Editing existing files**: Use `str_replace` for modifying existing files. NEVER use `create` on existing files as this causes data loss
- **Build artifacts**: The `dist/` directory and `node_modules/` are automatically excluded via `.gitignore`
- **Temporary files**: Create temporary files in `/tmp` directory to avoid accidental commits
- **SCSS compilation**: SCSS files are compiled automatically during build - no need to manually compile

## Troubleshooting

### Common Issues and Solutions

- **Main page not showing new experiment**: Run `npm run start-page` to regenerate src/index.html
- **SCSS not compiling**: Ensure you're running `npm run watch:scss` or build the project
- **Experiment not loading**: Check that info.json exists and has valid JSON syntax
- **Dev server not starting**: Verify port 5173 is available or check for Node.js compatibility issues
- **Build failures**: Ensure all experiment directories have valid index.html files

### File Organization Rules

- Each experiment MUST have its own directory under src/
- Each experiment MUST include info.json for metadata
- The \_copy directory is excluded from the main page generation
- Styles can be .css or .scss (SCSS gets compiled automatically during build)

### Performance Notes

- All builds and commands are very fast (under 5 seconds)
- Development server starts almost instantly (~200ms)
- Hot reload works for all file changes during development
- SCSS compilation is handled automatically by Vite during builds

### Browser Compatibility and Testing

- **Interactive experiments**: Many experiments use modern APIs (Web Audio, Canvas, etc.)
- **Mobile support**: Test experiments on both desktop and mobile/touch devices
- **Audio experiments**: Theremin and Wuug require user interaction to start audio (browser requirement)
- **Canvas experiments**: Check performance with different screen sizes and pixel densities
- **Feature detection**: Some experiments may require feature detection for older browsers

## Development Workflow Summary

1. **Setup**: `npm install`
2. **Development**: `npm run dev` then open http://localhost:5173/
3. **Create experiments**: Copy from src/\_copy/ template, update info.json, run `npm run start-page`
4. **Format code**: `npm run format`
5. **Build**: `npm run build`
6. **Manual testing**: Always validate through browser interaction

Remember: This project has no automated tests, so thorough manual validation through the browser is essential for every change.

<tool_calling>
You have the capability to call multiple tools in a single response. For maximum efficiency, whenever you need to perform multiple independent operations, ALWAYS invoke all relevant tools simultaneously rather than sequentially. Especially when exploring repository, reading files, viewing directories, validating changes or replying to comments.
</tool_calling>
