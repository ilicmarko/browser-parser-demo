// Sample HTML to parse
const sampleHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Sample Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome</h1>
    <p>This is a sample page</p>
    <img src="image.jpg" alt="Sample image">
</body>
</html>`;

class HTMLParser {
    constructor() {
        this.lines = sampleHTML.split('\n');
        this.currentLine = 0;
        this.domTree = [];
        this.isPreloadScannerEnabled = false;
        this.tagStack = []; // Stack to track open tags
        this.parseDelay = 1000; // 1 second delay
        this.lastBlockingResource = null;
        this.pendingCssDownloads = new Set(); // Track pending CSS downloads
        this.pendingScripts = new Set(); // Track pending scripts
        this.preloadFoundResources = new Set(); // Track resources found by preload scanner
        this.setupEventListeners();
        this.initializeDisplay();
    }

    setupEventListeners() {
        document.getElementById('parseNextBtn').addEventListener('click', () => {
            if (this.isPreloadScannerEnabled) {
                this.runPreloadScanner();
            }
            this.parseUntilBlocking();
        });
        document.getElementById('togglePreloadBtn').addEventListener('click', () => this.togglePreloadScanner());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        // Add event listener for HTML content changes
        const codeDisplay = document.getElementById('codeDisplay');
        codeDisplay.addEventListener('input', () => {
            this.updateHTMLContent();
        });
    }

    updateHTMLContent() {
        const codeDisplay = document.getElementById('codeDisplay');
        const preloadDisplay = document.getElementById('preloadDisplay');

        // Update the lines array with new content
        this.lines = codeDisplay.textContent.split('\n');

        // Update preload scanner display
        if (this.isPreloadScannerEnabled) {
            this.runPreloadScanner();
        } else {
            preloadDisplay.textContent = codeDisplay.textContent;
        }
    }

    initializeDisplay() {
        const codeDisplay = document.getElementById('codeDisplay');
        codeDisplay.textContent = sampleHTML;
        codeDisplay.contentEditable = true;
        codeDisplay.spellcheck = false;
        codeDisplay.style.whiteSpace = 'pre-wrap';
        codeDisplay.style.wordWrap = 'break-word';

        document.getElementById('parseNextBtn').textContent = 'Parse';
        document.getElementById('preloadDisplay').textContent = sampleHTML;
    }

    async parseUntilBlocking() {
        if (this.currentLine >= this.lines.length) {
            const button = document.getElementById('parseNextBtn');
            button.textContent = 'Parse';
            button.disabled = false;
            this.addMessage('Parsing complete!', 'info');

            // Show render success if all CSS is downloaded
            if (this.pendingCssDownloads.size === 0) {
                this.addMessage('Document rendered successfully!', 'success');
            }
            return;
        }

        const button = document.getElementById('parseNextBtn');
        button.textContent = 'Parsing...';
        button.disabled = true;

        const parseNext = async () => {
            if (this.currentLine >= this.lines.length) {
                button.textContent = 'Parse';
                button.disabled = false;
                this.addMessage('Parsing complete!', 'info');

                // Show render success if all CSS is downloaded
                if (this.pendingCssDownloads.size === 0) {
                    this.addMessage('Document rendered successfully!', 'success');
                }
                return;
            }

            const line = this.lines[this.currentLine].trim();
            if (!line) {
                this.currentLine++;
                await new Promise(resolve => setTimeout(resolve, this.parseDelay));
                parseNext();
                return;
            }

            // Highlight current line
            this.highlightCurrentLine();

            // Parse the line
            if (line.includes('<link')) {
                const href = line.match(/href="([^"]+)"/)?.[1];
                if (href && !line.includes('media="print"')) {
                    this.handleLinkTag(line);
                    this.pendingCssDownloads.add(href);
                } else {
                    this.handleLinkTag(line);
                }
            } else if (line.includes('<script')) {
                const src = line.match(/src="([^"]+)"/)?.[1];
                if (src && !line.includes('defer')) {
                    if (this.lastBlockingResource !== src) {
                        this.handleScriptTag(line);
                        this.lastBlockingResource = src;
                        this.pendingScripts.add(src);
                        this.addMessage(`Script found: ${src} - Parser will be blocked until script is downloaded and executed`, 'danger', null, src);
                        button.textContent = 'Waiting for Script';
                        button.disabled = true;
                        return;
                    }
                } else {
                    this.handleScriptTag(line);
                }
            } else if (line.includes('<img')) {
                this.handleImageTag(line);
            } else {
                this.handleRegularTag(line);
            }

            this.currentLine++;
            await new Promise(resolve => setTimeout(resolve, this.parseDelay));
            parseNext();
        };

        await parseNext();
    }

    highlightCurrentLine() {
        const codeDisplay = document.getElementById('codeDisplay');
        const lines = codeDisplay.innerHTML.split('\n');
        lines[this.currentLine] = `<span class="highlight">${lines[this.currentLine]}</span>`;
        codeDisplay.innerHTML = lines.join('\n');
    }

    handleLinkTag(line) {
        const href = line.match(/href="([^"]+)"/)?.[1];
        if (href) {
            const isBlocking = !line.includes('media="print"');
            this.addMessage(
                `Found ${isBlocking ? 'render-blocking' : 'non-blocking'} resource: ${href}`,
                isBlocking ? 'danger' : 'info',
                isBlocking ? href : null
            );
            this.addToDomTree('link', href, isBlocking);
        }
    }

    handleScriptTag(line) {
        const src = line.match(/src="([^"]+)"/)?.[1];
        if (src) {
            const isBlocking = !line.includes('defer');
            this.addMessage(
                `Found ${isBlocking ? 'render-blocking' : 'non-blocking'} script: ${src}`,
                isBlocking ? 'danger' : 'info',
                null,
                isBlocking ? src : null
            );
            this.addToDomTree('script', src, isBlocking);
        }
    }

    handleImageTag(line) {
        const src = line.match(/src="([^"]+)"/)?.[1];
        if (src) {
            const isPreloadFound = this.preloadFoundResources.has(src);
            this.addMessage(`Found image: ${src}`, 'info', null, null, isPreloadFound);
            this.addToDomTree('img', src);
        }
    }

    handleRegularTag(line) {
        const tagName = line.match(/<\/?(\w+)/)?.[1];
        if (tagName) {
            // Check if it's a closing tag
            if (line.includes('</')) {
                // Remove the tag from stack if it matches the opening tag
                if (this.tagStack.length > 0 && this.tagStack[this.tagStack.length - 1] === tagName) {
                    this.tagStack.pop();
                }

                if (line.startsWith('</')) {
                    return;
                }
            }
            // Add the node at current stack level
            this.addToDomTree(tagName);

            // For opening tags (not self-closing), add to stack
            if (!line.includes('</') && !line.includes('/>')) {
                this.tagStack.push(tagName);
            }
        }
    }

    addToDomTree(tagName, resource = null, isBlocking = false) {
        const domTree = document.getElementById('domTree');
        const node = document.createElement('div');
        node.className = `dom-tree-node level-${this.tagStack.length}`;
        if (isBlocking) {
            node.classList.add('blocking');
        }
        node.textContent = resource ? `${tagName} (${resource})` : tagName;
        domTree.appendChild(node);
    }

    addMessage(message, type, cssUrl = null, scriptUrl = null, isPreloadFound = false) {
        const messages = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;

        // Check if this resource was found by preload scanner
        const resourcePreloadFound = (cssUrl && this.preloadFoundResources.has(cssUrl)) ||
                                   (scriptUrl && this.preloadFoundResources.has(scriptUrl));

        if (cssUrl) {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${message}
                    ${resourcePreloadFound ? '<span class="preload-badge">Preload Found</span>' : ''}
                </div>
                <div class="message-actions">
                    <button class="confirm-css" data-css="${cssUrl}">Confirm Download</button>
                </div>
            `;
            messageElement.querySelector('.confirm-css').addEventListener('click', (e) => {
                this.confirmCssDownload(cssUrl);
                e.target.disabled = true;
                e.target.textContent = 'Downloaded';
            });
        } else if (scriptUrl) {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${message}
                    ${resourcePreloadFound ? '<span class="preload-badge">Preload Found</span>' : ''}
                </div>
                <div class="message-actions">
                    <button class="confirm-script" data-script="${scriptUrl}" ${this.pendingCssDownloads.size > 0 ? 'disabled' : ''}>
                        ${this.pendingCssDownloads.size > 0 ? 'Waiting for CSS...' : 'Confirm Parsed'}
                    </button>
                </div>
            `;
            const scriptButton = messageElement.querySelector('.confirm-script');
            if (!this.pendingCssDownloads.size) {
                scriptButton.addEventListener('click', (e) => {
                    this.confirmScriptParsed(scriptUrl);
                    e.target.disabled = true;
                    e.target.textContent = 'Parsed';
                });
            }
        } else {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${message}
                    ${isPreloadFound ? '<span class="preload-badge">Preload Found</span>' : ''}
                </div>
            `;
        }

        messages.appendChild(messageElement);
    }

    confirmScriptParsed(scriptUrl) {
        this.pendingScripts.delete(scriptUrl);
        this.addMessage(`Script parsed and executed: ${scriptUrl}`, 'info');

        // Continue parsing after script is confirmed
        const button = document.getElementById('parseNextBtn');
        button.textContent = 'Parse';
        button.disabled = false;
        this.parseUntilBlocking();
    }

    confirmCssDownload(cssUrl) {
        this.pendingCssDownloads.delete(cssUrl);
        this.addMessage(`CSS resource downloaded: ${cssUrl}`, 'info');

        // Enable any waiting script buttons if all CSS is now downloaded
        if (this.pendingCssDownloads.size === 0) {
            document.querySelectorAll('.confirm-script').forEach(button => {
                if (button.disabled) {
                    button.disabled = false;
                    button.textContent = 'Confirm Parsed';
                    const scriptUrl = button.dataset.script;
                    button.addEventListener('click', (e) => {
                        this.confirmScriptParsed(scriptUrl);
                        e.target.disabled = true;
                        e.target.textContent = 'Parsed';
                    });
                }
            });
        }

        // Only show render success if all CSS is downloaded AND document is fully parsed
        if (this.pendingCssDownloads.size === 0 && this.currentLine >= this.lines.length) {
            this.addMessage('Document rendered successfully!', 'success');
        }
    }

    togglePreloadScanner() {
        this.isPreloadScannerEnabled = !this.isPreloadScannerEnabled;
        const button = document.getElementById('togglePreloadBtn');
        button.textContent = this.isPreloadScannerEnabled ? 'Disable Preload Scanner' : 'Enable Preload Scanner';

        if (!this.isPreloadScannerEnabled) {
            // Reset the preload display when disabled
            document.getElementById('preloadDisplay').textContent = document.getElementById('codeDisplay').textContent;
        }
    }

    escapeHTML(html) {
        return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    processResource(line, type, attribute) {
        const value = line.match(new RegExp(`${attribute}="([^"]+)"`))?.[1];
        if (value) {
            const escapedLine = this.escapeHTML(line);
            return {
                type,
                url: value,
                line: escapedLine
            };
        }
        return null;
    }

    runPreloadScanner() {
        this.addMessage('Preload scanner started...', 'info preload');
        const preloadDisplay = document.getElementById('preloadDisplay');
        const codeDisplay = document.getElementById('codeDisplay');
        let htmlContent = this.escapeHTML(codeDisplay.textContent);

        // Clear previous findings
        this.preloadFoundResources.clear();

        // Find and highlight all preloadable resources
        const resources = [];
        const resourceTypes = [
            { type: 'link', attribute: 'href' },
            { type: 'script', attribute: 'src' },
            { type: 'img', attribute: 'src' }
        ];

        this.lines.forEach(line => {
            resourceTypes.forEach(({ type, attribute }) => {
                if (line.includes(`<${type}`)) {
                    const resource = this.processResource(line, type, attribute);
                    if (resource) {
                        resources.push(resource);
                        this.preloadFoundResources.add(resource.url);
                        htmlContent = htmlContent.replace(
                            resource.line,
                            `<span class="preload-highlight">${resource.line}</span>`
                        );
                    }
                }
            });
        });

        preloadDisplay.innerHTML = htmlContent;

        this.addMessage('Preload scanner found resources:', 'info preload');
        resources.forEach(resource => {
            this.addMessage(`${resource.type}: ${resource.url}`, 'info preload');
        });

        // Add success message and show completion indicator
        this.addMessage('Preload scanner completed successfully!', 'success preload');
        document.querySelector('.preload-section').classList.add('completed');
    }

    reset() {
        this.currentLine = 0;
        this.tagStack = [];
        this.lastBlockingResource = null;
        this.pendingCssDownloads.clear();
        this.pendingScripts.clear();
        this.preloadFoundResources.clear();
        document.getElementById('domTree').innerHTML = '';
        document.getElementById('messages').innerHTML = '';

        // Reset the editable content
        const codeDisplay = document.getElementById('codeDisplay');
        codeDisplay.textContent = sampleHTML;
        document.getElementById('preloadDisplay').textContent = sampleHTML;

        this.initializeDisplay();
    }
}

// Initialize the parser when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HTMLParser();
});
