const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Read README.md
const readmePath = path.join(__dirname, '..', 'README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf-8');

// Convert markdown to HTML
const htmlContent = marked.parse(readmeContent);

// Create the full HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Parser & Preload Scanner Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 2rem; }
        h3 { color: #2c3e50; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code {
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }
        pre {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        .demo-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .demo-card {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .demo-card h3 {
            margin-top: 0;
        }
    </style>
</head>
<body>
    ${htmlContent}
    <div class="demo-links">
        <div class="demo-card">
            <h3>HTML Parser Demo</h3>
            <p>Explore how browsers parse HTML and build the DOM tree.</p>
            <a href="/parser/">Launch Demo →</a>
        </div>
        <div class="demo-card">
            <h3>CSS Demo</h3>
            <p>See CSS parsing and cascade rules in action.</p>
            <a href="/css/">Launch Demo →</a>
        </div>
        <div class="demo-card">
            <h3>Bad Demo</h3>
            <p>A demo of a site with bad performance practices. Try to optimize it!</p>
            <a href="/demo/">Launch Demo →</a>
        </div>
    </div>
</body>
</html>`;

// Write the generated HTML to index.html
const indexPath = path.join(__dirname, '..', 'index.html');
fs.writeFileSync(indexPath, fullHtml);

console.log('Generated index.html successfully!');
