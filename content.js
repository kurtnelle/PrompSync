// PromptSync - content.js
// Author: Jules (AI Agent)
// Purpose: This script runs on pages matching chat.openai.com/*.
// It observes the DOM for markdown blocks and extracts content based on special PUSH comments.

console.log("PromptSync: content.js loaded and active.");

// Regex to detect the PUSH comment.
// It captures:
// 1. The command (e.g., "github", "gitlab:docs")
// 2. (Optional) repo="owner/repository"
// 3. (Optional) branch="branch-name"
const PUSH_TAG_REGEX = /<!--PUSH:([a-zA-Z0-9_:]+)\s*(repo=([\w-]+/[\w.-]+))?\s*(branch=([\w-]+))?\s*-->/i;

/**
 * Scans the document for elements with the class '.markdown' (used by ChatGPT).
 * If a block contains a PUSH_TAG_REGEX comment, it extracts information and sends it to the background script.
 */
function checkForMarkdownBlocks() {
    // Debug log, can be commented out in production
    // console.log("PromptSync: Checking for markdown blocks.");

    // ChatGPT renders content, including code blocks, within elements having the 'markdown' class.
    const markdownBlocks = document.querySelectorAll('.markdown');

    if (markdownBlocks.length === 0) {
        // console.log("PromptSync: No markdown blocks found on this update.");
        return;
    }

    markdownBlocks.forEach(block => {
        // Avoid processing the same block multiple times if the DOM updates frequently around it.
        if (block.dataset.promptsyncProcessed === 'true') {
            return;
        }

        // Using innerHTML because the PUSH tag is an HTML comment (<!-- ... -->)
        // and might not be present in innerText or textContent.
        const contentHTML = block.innerHTML;
        const match = contentHTML.match(PUSH_TAG_REGEX);

        if (match) {
            console.log("PromptSync: Found a PUSH tag in a markdown block. Element:", block);

            // Extracting the user-visible text content.
            // If the block is a <pre><code> structure (common for code), get text from <code>.
            // Otherwise, fall back to the block's innerText.
            let extractedContent = "";
            const codeElement = block.querySelector('code');
            if (block.tagName === 'PRE' && codeElement) {
                extractedContent = codeElement.innerText;
            } else {
                // For non-pre/code blocks or if code tag is not found, use innerText of the main block.
                // This might include text from other child elements if the .markdown class is on a container.
                extractedContent = block.innerText;
            }

            // The PUSH comment itself is usually not part of `innerText`.
            // However, if it were (e.g., due to unusual rendering), this would remove it.
            const commentText = match[0]; // The full comment string e.g., "<!--PUSH:github repo=...-->"
            if (extractedContent.includes(commentText)) {
                extractedContent = extractedContent.replace(commentText, "").trim();
            }

            const pushCommand = match[1]; // e.g., "github"
            const repo = match[3];        // e.g., "user/myrepo" or undefined
            const branch = match[5];      // e.g., "main" or undefined

            const messagePayload = {
                type: "PUSH_DETECTED", // Message type for background.js to identify the action
                data: {
                    rawBlockContent: block.innerHTML, // Includes the PUSH comment and original HTML structure
                    extractedContent: extractedContent.trim(), // The cleaned text content intended for the push
                    tag: pushCommand,
                    repo: repo,
                    branch: branch,
                    timestamp: new Date().toISOString() // ISO string for easy parsing later
                }
            };

            console.log("PromptSync: Sending message to background script with payload:", messagePayload);
            chrome.runtime.sendMessage(messagePayload, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("PromptSync: Error sending message to background script:", chrome.runtime.lastError.message, "Payload:", messagePayload);
                } else {
                    console.log("PromptSync: Message successfully sent to background. Response:", response);
                }
            });

            // Mark the block as processed to prevent re-processing on minor DOM updates.
            block.dataset.promptsyncProcessed = 'true';
        }
    });
}

// Perform an initial check when the script loads, as content might already be on the page.
checkForMarkdownBlocks();

// Set up a MutationObserver to watch for dynamic changes in the DOM.
// This is essential as ChatGPT loads and updates content asynchronously.
const observer = new MutationObserver((mutationsList, obs) => {
    // For performance, check if the mutations likely added new markdown content.
    let relevantChangeDetected = false;
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                // Check if the added node itself is a markdown block or contains one.
                if (node.nodeType === Node.ELEMENT_NODE) { // Ensure it's an element
                    if ((node.classList && node.classList.contains('markdown')) || node.querySelector('.markdown')) {
                        relevantChangeDetected = true;
                        break;
                    }
                }
            }
        }
        if (relevantChangeDetected) break;
    }

    if (relevantChangeDetected) {
        // console.log("PromptSync: Relevant DOM change detected. Re-scanning for markdown blocks.");
        checkForMarkdownBlocks();
    }
});

// Start observing the entire document body for additions of child elements and subtree modifications.
observer.observe(document.body, {
    childList: true, // Watch for direct children changes (nodes added or removed)
    subtree: true    // Watch for changes in all descendants of the body
});

console.log("PromptSync: MutationObserver initialized and observing document body.");

// Debugging helper: To manually trigger a check from the browser console:
// window.forcePromptSyncCheck = checkForMarkdownBlocks;
// console.log("PromptSync: To manually trigger a check, run `window.forcePromptSyncCheck()` in the console.");

// Example of how to simulate a block being added for testing (uncomment in dev tools):
/*
setTimeout(() => {
    console.log("PromptSync: Simulating a markdown block addition for testing.");
    const testDiv = document.createElement('div');
    testDiv.className = 'markdown'; // Class that the script looks for
    // Example content with a PUSH tag
    testDiv.innerHTML = `
        <p>Some introductory text.</p>
        <!--PUSH:github repo=my-user/my-repo branch=test-branch-->
        <pre><code class="language-javascript">
        // This is the code to be pushed
        function greet() {
            console.log("Hello from PromptSync test!");
        }
        greet();
        </code></pre>
        <p>Some concluding text.</p>
    `;
    document.body.appendChild(testDiv); // Add to a part of the page that's visible or being observed
    checkForMarkdownBlocks(); // Manually call after adding for immediate test
}, 8000); // Delay to ensure page is loaded
*/
