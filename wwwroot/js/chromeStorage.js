// PromptSync - chromeStorage.js
// Author: Jules (AI Agent)
// Purpose: Provides JavaScript helper functions for the Blazor application
// to interact with Chrome Extension APIs, specifically `chrome.storage.local`.
// These functions are callable from C# via Blazor's JSInterop.

console.log("PromptSync: chromeStorage.js loaded.");

window.chromeStorage = {
    /**
     * Retrieves a value from chrome.storage.local.
     * @param {string} key - The key of the item to retrieve.
     * @returns {Promise<string|null>} A promise that resolves with the JSON string of the retrieved item,
     *                                 or null if the key is not found or an error occurs.
     */
    getLocal: function (key) {
        return new Promise((resolve, reject) => {
            // Check if the Chrome storage API is available
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get([key], function (result) {
                    if (chrome.runtime.lastError) {
                        const errorMsg = `Error getting data for key '${key}' from chrome.storage.local: ${chrome.runtime.lastError.message}`;
                        console.error("PromptSync: " + errorMsg);
                        // Rejecting the promise allows Blazor to catch it as a JSException
                        reject(new Error(errorMsg));
                    } else {
                        // `result` is an object like { "yourKey": value }.
                        // We want to return the `value` itself.
                        const value = result[key];
                        if (value === undefined || value === null) {
                            // If key not found or explicitly null, resolve with null.
                            // Blazor's JSRuntime.InvokeAsync<string?> will handle this as C# null.
                            console.log(`PromptSync: No data found or null value for key '${key}'.`);
                            resolve(null);
                        } else {
                            // For complex objects stored by background.js, they are already in JS object form.
                            // Blazor expects a string if C# side is T Deserialize<T>(string).
                            // So, we stringify the object here.
                            try {
                                const jsonString = JSON.stringify(value);
                                console.log(`PromptSync: Successfully retrieved and stringified data for key '${key}':`, jsonString);
                                resolve(jsonString);
                            } catch (stringifyError) {
                                const errorMsg = `Error stringifying data for key '${key}': ${stringifyError.message}`;
                                console.error("PromptSync: " + errorMsg, value);
                                reject(new Error(errorMsg));
                            }
                        }
                    }
                });
            } else {
                const errorMsg = 'chrome.storage.local API is not available. Ensure the script runs in an extension context.';
                console.error("PromptSync: " + errorMsg);
                reject(new Error(errorMsg));
            }
        });
    },

    /**
     * Sets a value in chrome.storage.local.
     * (Currently not used by the Blazor app but provided for completeness)
     * @param {string} key - The key of the item to set.
     * @param {any} value - The value to store. Should be JSON-serializable.
     * @returns {Promise<boolean>} A promise that resolves with true if successful, or rejects with an error.
     */
    setLocal: function (key, value) {
        return new Promise((resolve, reject) => {
            if (chrome && chrome.storage && chrome.storage.local) {
                let dataToStore = {};
                dataToStore[key] = value; // The value is stored directly; Chrome handles serialization.
                chrome.storage.local.set(dataToStore, function () {
                    if (chrome.runtime.lastError) {
                        const errorMsg = `Error setting data for key '${key}' in chrome.storage.local: ${chrome.runtime.lastError.message}`;
                        console.error("PromptSync: " + errorMsg);
                        reject(new Error(errorMsg));
                    } else {
                        console.log(`PromptSync: Successfully set data for key '${key}'.`);
                        resolve(true);
                    }
                });
            } else {
                const errorMsg = 'chrome.storage.local API is not available.';
                console.error("PromptSync: " + errorMsg);
                reject(new Error(errorMsg));
            }
        });
    },

    /**
     * Example of how Blazor could listen for storage changes.
     * The Blazor component would need to pass a DotNetObjectReference to this function.
     * @param {object} dotnetHelper - A DotNetObjectReference instance from Blazor.
     *                                Must have an invokable method like 'OnChromeStorageChanged'.
     */
    // listenForChanges: function (dotnetHelper) {
    //     if (chrome && chrome.storage && chrome.storage.onChanged) {
    //         chrome.storage.onChanged.addListener(function (changes, namespace) {
    //             if (namespace === 'local') {
    //                 console.log("PromptSync: Detected chrome.storage.local change:", changes);
    //                 // Pass all changes (or specific ones) to the .NET side.
    //                 // The .NET method 'OnChromeStorageChanged' would receive this as a JSON string.
    //                 try {
    //                     dotnetHelper.invokeMethodAsync('OnChromeStorageChanged', JSON.stringify(changes));
    //                 } catch (e) {
    //                     console.error("PromptSync: Error invoking .NET method from storage listener:", e);
    //                     // Potentially dispose the dotnetHelper if it's invalid.
    //                 }
    //             }
    //         });
    //         console.log("PromptSync: Listening for chrome.storage.local changes.");
    //     } else {
    //         console.warn('PromptSync: chrome.storage.onChanged API is not available for listening.');
    //     }
    // }
};

// To test from popup console:
// window.chromeStorage.getLocal('latestPromptData').then(d => console.log(d)).catch(e => console.error(e))
