let BACKEND_URL;
let LOGIN_URL;

function SET_BACKEND_URL_AYSNC() {
    return new Promise((resolve, reject) => {
        chrome.management.getSelf(function (info) {

            console.log(info)
            if (info.installType === "development") {
                BACKEND_URL = "http://100.88.185.98:5500";
                LOGIN_URL = "http://100.88.185.98:3000";
                resolve();
            } else {
                BACKEND_URL = "https://yt-engine.com/api";
                LOGIN_URL = "https://yt-engine.com";
                resolve();
            }
        });
    })
}

