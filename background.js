// PromptSync - background.js (Service Worker)
// Author: Jules (AI Agent)
// Purpose: Handles messages from content scripts, stores data in chrome.storage.local,
// and potentially communicates with backend services in the future.

console.log("PromptSync: Background service worker started.");

// Listener for when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener((details) => {
  console.log("PromptSync: Extension lifecycle event:", details.reason);

  // Initialize 'latestPromptData' in chrome.storage.local if it's not already set.
  // This ensures the Blazor popup has a consistent key to look for.
  chrome.storage.local.get(["latestPromptData"], (result) => {
    if (chrome.runtime.lastError) {
        console.error("PromptSync: Error checking initial storage:", chrome.runtime.lastError.message);
        return;
    }
    if (result.latestPromptData === undefined) {
      // Set to null explicitly to indicate no data yet.
      chrome.storage.local.set({ latestPromptData: null }, () => {
        if (chrome.runtime.lastError) {
            console.error("PromptSync: Error initializing latestPromptData in storage:", chrome.runtime.lastError.message);
        } else {
            console.log("PromptSync: Initialized 'latestPromptData' to null in chrome.storage.local.");
        }
      });
    } else {
        console.log("PromptSync: 'latestPromptData' already exists in storage. Value:", result.latestPromptData);
    }
  });
});

// Listener for messages sent from other parts of the extension (e.g., content.js).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("PromptSync: Message received in background script.");
  console.log("   From:", sender.tab ? "Content script ID: " + sender.id + " from tab: " + sender.tab.url : "Extension context ID: " + sender.id);
  console.log("   Message payload:", message);

  if (message.type === "PUSH_DETECTED") {
    const receivedData = message.data;
    console.log("PromptSync: 'PUSH_DETECTED' message type recognized. Processing data:", receivedData);

    // Store the entire 'data' object received from content.js.
    // This object includes extractedContent, tag, repo, branch, and timestamp.
    // The Blazor popup will fetch this object using the key 'latestPromptData'.
    chrome.storage.local.set({ latestPromptData: receivedData }, () => {
      if (chrome.runtime.lastError) {
        const errorMsg = `PromptSync: Error setting 'latestPromptData' in chrome.storage.local: ${chrome.runtime.lastError.message}`;
        console.error(errorMsg);
        sendResponse({ status: "error", message: errorMsg });
      } else {
        console.log("PromptSync: Successfully stored 'latestPromptData'. Data:", receivedData);
        sendResponse({ status: "success", message: "Data stored successfully in chrome.storage.local." });

        // Future enhancement: Could send a message to an open popup to refresh its data,
        // or the popup could listen to chrome.storage.onChanged events.
        // For now, the popup refreshes on load or manual button click.
      }
    });

    // Return true to indicate that sendResponse will be called asynchronously.
    // This is crucial when chrome.storage.local.set (an async operation) is involved.
    return true;
  } else {
    console.warn("PromptSync: Received message of unknown type:", message.type);
    sendResponse({ status: "info", message: `Unknown message type '${message.type}' received.` });
    return false; // No asynchronous response pending for unknown types.
  }
});

// Example: How to inspect storage from the service worker console:
// chrome.storage.local.get(null, items => console.log(items));

console.log("PromptSync: Background script event listeners are set up and ready.");
