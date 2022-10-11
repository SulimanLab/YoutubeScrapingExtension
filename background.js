// when tab changes, print url
// decrease thread race condition occurrence
const seen = [];

chrome.alarms.onAlarm.addListener(function (objAlarm) {
    if (objAlarm.name === 'synchronize') {
        Youtube.synchronize({
            'intThreshold': 512
        }, function (objResponse) {
            console.log('synchronized youtube');
        });
    }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        // regex check if url is youtube
        if (tab.url.match(/youtube.com/)) {
            // console.log("onActivated");
            //lock
            const params = new URLSearchParams(tab.url.split('?')[1]);
            if (params.has('v')) {
                const videoId = params.get('v');
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


    var url = new URL('http://localhost:5500')
    var params = {videoId: videoId}
    url.search = new URLSearchParams(params).toString();
    fetch(url).then(function (response) {
        console.log(response)
    })

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

