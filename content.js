window.addEventListener("message", (event) => {
    // Make sure the message is from your website
    // alert(event)
    if (event.source !== window) return;

    if (event.data.type === "YT_ENGINE_CHECK") {
        // Send response back to webpage
        window.postMessage({
            type: "YT_ENGINE_RESPONSE",
            installed: true
        }, "*");

        // Also notify the background script if needed
        chrome.runtime.sendMessage({
            type: "YT_ENGINE_CHECK",
            origin: window.location.origin
        });
    }
});
