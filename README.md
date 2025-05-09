# HTML Parser & Preload Scanner Demo

This is an interactive demo application that visualizes how a browser parses HTML and how the preload scanner works. It helps understand the line-by-line parsing process and resource discovery.

## Features

- Line-by-line HTML parsing visualization
- DOM tree building visualization
- Resource discovery (scripts, stylesheets, images)
- Preload scanner simulation
- Render-blocking resource detection
- Network request visualization
- CSS parsing and cascade demonstration

## Project Structure

- `/parser` - HTML parsing and DOM tree visualization demo.
- `/css` - Demonstration that CSS is "script blocking".
- `/demo` - Small example that has multiple perf issues.

## Setup and Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to:
- HTML Parser: http://localhost:3000/parser/
- CSS Demo: http://localhost:3000/css/
- Network Demo: http://localhost:3000/demo/

## How to Use

### HTML Parser Demo
1. Use the "Parse" button to step through the HTML parsing process
2. Watch as the DOM tree builds up on the right side
3. Notice the messages about render-blocking resources
4. Click "Enable Preload Scanner" to see how the browser quickly scans for resources
5. Use "Reset" to start over

### CSS Demo
1. Explore how CSS rules are parsed and applied
2. See the cascade and specificity in action
3. Understand how different selectors affect element styling

### Network Demo
1. Visualize how resources are loaded
2. See the timing of different network requests
3. Understand the impact of resource loading on page performance

## Understanding the Demos

- The left panel shows the code being parsed
- The right panel shows the visualization (DOM tree, CSS cascade, or network requests)
- The bottom panel shows messages about events and timing
- Yellow highlights indicate render-blocking resources
- The preload scanner shows how browsers quickly scan for resources before parsing

## Sample Content

The demos use various samples to demonstrate:
- HTML parsing and DOM construction
- CSS cascade and specificity rules
- Network request timing and prioritization
- Resource loading patterns
- Performance optimization techniques
