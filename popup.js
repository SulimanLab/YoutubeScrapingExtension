let BACKEND_URL = "http://100.88.185.98:5500";
let LOGIN_URL = "http://100.88.185.98:3000";
chrome.management.getSelf(function (info) {
    console.log(info)
    if (info.installType === "development") {
        BACKEND_URL = "http://100.88.185.98:5500";
        LOGIN_URL = "http://100.88.185.98:3000";
    } else {
        BACKEND_URL = "https://yt-engine.com/api";
        LOGIN_URL = "https://yt-engine.com";

    }
});
