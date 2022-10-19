const seen = [];

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        chrome.cookies.get({
            'url': 'http://100.88.185.98:5500',
            'name': "session"
        }, function (cookie) {
            console.log(cookie)
            chrome.cookies.set({
                "name": "session",
                "url": "http://100.88.185.98:3000",
                "value": cookie.value
            }, function (cookie) {
                console.log(JSON.stringify(cookie));
                console.log(chrome.extension.lastError);
                console.log(chrome.runtime.lastError);
            })
        })
        callBackend('NxHVnK00Q6k')
        sendResponse({farewell: "goodbye"});

    }
);


chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        // regex check if url is youtube
        if (tab.url.match(/youtube.com/)) {
            console.log("youtube page is open");
            const params = new URLSearchParams(tab.url.split('?')[1]);
            if (params.has('v')) {
                const videoId = params.get('v');
                console.log(videoId);
                if (seen.indexOf(videoId) === -1) {
                    console.log("videoId not seen before");
                    seen.push(videoId)
                    setVideoId(videoId).then(function (result) {
                        if (result) {
                            callBackend(videoId)
                        }
                    });
                }
            }
        }
    });
});

async function setVideoId(videoId) {
    return await new Promise((resolve) => {
        chrome.storage.sync.get([videoId], async function (data) {
            if (data[videoId] === undefined) {
                chrome.storage.sync.set({[videoId]: "videoId"}, function () {
                });
                resolve(true)
            }
            resolve(false)
        })
    })
}

// create a function to call the backend
function callBackend(videoId) {
    // call backend with search params


    const url = new URL('http://100.88.185.98:5500');
    const params = {videoId: videoId};
    url.search = new URLSearchParams(params).toString();
    console.log(url)
    fetch(url)
        .then(function (response) {
            console.log(response)
        }).catch(function (error) {
            console.error(error)
        }
    )


}


//when url changes, print url
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // console.log("updated");
    if (tab.url.match(/youtube.com/)) {
        var params = new URLSearchParams(tab.url.split('?')[1]);
        if (params.has('v')) {

            var videoId = params.get('v');
            if (seen.indexOf(videoId) === -1) {
                seen.push(videoId)
                setVideoId(videoId).then(function (result) {
                    if (result) {
                        callBackend(videoId)
                    }
                });
            }
        }
    }
});

