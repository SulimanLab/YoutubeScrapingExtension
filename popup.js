let BACKEND_URL;
let LOGIN_URL;

function SET_BACKEND_URL_AYSNC() {
    return new Promise((resolve, reject) => {
        chrome.management.getSelf(function (info) {

            console.log(info)
            if (info.installType === "development") {
                BACKEND_URL = "https://yt-engine.com/api";
                LOGIN_URL = "https://yt-engine.com/login";
                resolve();
            } else {
                BACKEND_URL = "https://yt-engine.com/api";
                LOGIN_URL = "https://yt-engine.com/login";
                resolve();
            }
        });
    })
}

