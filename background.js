const seen = [];

const BACKEND_URL = "http://100.88.185.98";

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        // regex check if url is youtube
        if (tab.url.match(/youtube.com/)) {
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

function callBackend(videoId) {
    // call backend with search params


    const url = new URL(BACKEND_URL + ':5500');
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


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request.message)
        if (request.message === "get_history") {
            sendResponse({message: "history"});
        } else if (request.message === "loadHistory") {
            Youtube.synchronize({
                'intThreshold': 100000000
            }, function (objData) {
                sendResponse({complete: true})
            })

        } else if (request.message === "fetchDelta") {
            Youtube.synchronize({
                'fetchDelta': true,
                'intThreshold': 1000
            }, function (objData) {
                sendResponse({complete: true})
            })
        }

    }
);


function send_message(message, callback) {
    chrome.runtime.sendMessage({message: message}, callback);
}

function loadHistoryFunc(dd) {
    dd()
    // Youtube.synchronize({
    //     'intThreshold': 1000000
    // })
}


var funcHackyparse = function (strJson) {
    for (var intLength = 1; intLength < strJson.length; intLength += 1) {
        if (strJson[intLength - 1] !== '}') {
            continue;
        }

        try {
            return JSON.parse(strJson.substr(0, intLength));
        } catch (objError) {
        }
    }

    return null;
}

var Node = {
    series: function (objFunctions, funcCallback) {

        var strFunctions = Object.keys(objFunctions);
        var objWorkspace = {};

        var funcNext = function (objArguments, objOverwrite) {
            if (objArguments === null) {
                return funcCallback(null);
            }

            objWorkspace[strFunctions[0]] = objArguments;

            strFunctions.shift();

            if (objOverwrite !== undefined) {
                if (typeof (objOverwrite) === 'string') {
                    strFunctions = Object.keys(objFunctions);

                    while (true) {
                        if (strFunctions.length === 0) {
                            break;

                        } else if (strFunctions[0] === objOverwrite) {
                            break;

                        }

                        strFunctions.shift();
                    }

                } else if (typeof (objOverwrite) === 'object') {
                    strFunctions = objOverwrite;

                }
            }

            if (strFunctions.length === 0) {
                return funcCallback(objWorkspace);
            }

            objFunctions[strFunctions[0]](objWorkspace, funcNext);
        };

        objFunctions[strFunctions[0]](objWorkspace, funcNext);
    }
};

function getDateWithMonthAndDay(dayMonth) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    const date = new Date();
    const month = months.indexOf(dayMonth[0].toLowerCase());
    const day = parseInt(dayMonth[1]);
    date.setMonth(month);
    date.setDate(day);
    return date;
}

function toIso(date) {
    return date.toISOString().slice(0, 10)
}

// dateDay might be of pattern: today, yesterday, sunday, Oct 13, 'Oct 13, 2021'
function stringDateToDate(dateDay) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const day = dateDay.toLowerCase();

    if (day === "today") {
        return toIso(new Date());
    } else if (day === "yesterday") {
        let yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
        return toIso(yesterday);
    } else if (days.includes(day)) {
        const dayIndex = days.indexOf(day);
        const dayPos = new Date().getDay() - dayIndex
        let date = 0
        if (dayPos < 0) {
            date = new Date(new Date().setDate(new Date().getDate() - (7 + dayPos)));
        } else {
            date = new Date(new Date().setDate(new Date().getDate() - (dayPos)));
        }
        return toIso(date);
    } else {
        if (dateDay.includes(",")) {
            const dayMonth_year = dateDay.split(",");
            if (dayMonth_year.length !== 2) {
                return null;
            }
            const dayMonth = dayMonth_year[0].split(" ");
            if (dayMonth.length === 2) {
                const d = getDateWithMonthAndDay(dayMonth);
                d.setFullYear(parseInt(dayMonth_year[1]));
                return toIso(d);
            }
        }
        const dayMonth = dateDay.split(" ");
        if (dayMonth.length === 2) {
            return toIso(getDateWithMonthAndDay(dayMonth));
        }
    }
}

function cleanupTitle(strTitle) {
    return strTitle.split('\\u0022')
        .join('"')
        .split('\\u0026')
        .join('&')
        .split('\\u003C')
        .join('<')
        .split('\\u003C')
        .join('=')
        .split('\\u003E')
        .join('>')
        .split('\\u003E')
        .join('>');

}


function getUserFromBackend() {
    return new Promise((resolve, reject) => {
        fetch(BACKEND_URL + ":5500" + "/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                resolve(data);
            })
    });
}

function save_history(body) {
    return new Promise((resolve, reject) => {
        fetch(BACKEND_URL + ":5500" + "/save-history", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then((response) => {
                if (response.status === 200) {
                    resolve(response);
                } else {
                    reject(response);
                }
            })
            .catch((err) => {
                reject(err);
            })
    });
}


function updateHtml() {
    chrome.storage.sync.get(['extensions.yt-engine.fetchedVideos'], function (data) {
        console.log(data['extensions.yt-engine.fetchedVideos'])
    })


}

function parseHTML(objArguments, responseText, funcCallback) {
    // get username from responseText
    // try {
    //     const objUsername = responseText.split("var ytInitialData = ")[1].split(";</script>")[0];
    //     const asd = new RegExp('confirmDialogRenderer.*dialogMessages"([^"]*)"runs"([^"]*)"text":(.*)"bold', 'g');
    //     const username_html = asd.exec(objUsername);
    //     const username = username_html[3].split('"')[1];
    //     console.log(username);
    // } catch (e) {
    //     console.log(e);
    //     // throw e;
    // }


    if (objArguments.objYtcfg === null) {
        objArguments.objYtcfg = funcHackyparse(responseText.split('ytcfg.set(').find(function (strData) {
            return strData.indexOf('INNERTUBE_API_KEY') !== -1;
        }).slice(0, -2));
    }

    if (objArguments.objYtctx === null) {
        objArguments.objYtctx = funcHackyparse(responseText.split('"INNERTUBE_CONTEXT":')[1]);
    }

    var strRegex = null;
    const objContinuation = new RegExp('("continuationCommand":)([^"]*)("token":)([^"]*)(")([^"]*)(")', 'g');
    const objClicktrack = new RegExp('("continuationEndpoint":)([^"]*)("clickTrackingParams":)([^"]*)(")([^"]*)(")', 'g');
    const objVideo = new RegExp('("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")(.*?)(")', 'g');
    const matchDayVideo = new RegExp('("itemSectionRenderer")(.*?)("header":)(.*?)("text"|"simpleText")([^"]*)(")([^"]*)(.*?)(")', 'g');

    const strUnescaped = responseText.split('\\"').join('\\u0022').split('\r').join('').split('\n').join('');

    if ((strRegex = objContinuation.exec(strUnescaped)) !== null) {
        objArguments.strContinuation = strRegex[6];
    }

    if ((strRegex = objClicktrack.exec(strUnescaped)) !== null) {
        objArguments.strClicktrack = strRegex[6];
    }

    var objVideos = [];

    while ((strRegex = matchDayVideo.exec(strUnescaped)) !== null) {

        const dateDay = strRegex[8];
        const other = strRegex[0];
        while ((strRegex = objVideo.exec(other)) !== null) {

            const videosObj = {
                date: stringDateToDate(dateDay),
                origDate: dateDay,
                video_id: strRegex[6],
                title: cleanupTitle(strRegex[12])
            }
            objVideos.push(videosObj);
        }
    }
    return funcCallback(objVideos);
}


function mark_history_fetched() {
    return fetch(BACKEND_URL + ":5500" + "/mark-history-fetched", {
        method: "GET",
    }).then((response) => {
        if (response.status === 200) {
            return response
        } else {
            throw new Error("Error fetching history")
        }
    })
}

var Youtube = {
    synchronize: function (objRequest, funcResponse) {
        Node.series(
            {
                'checkUser': function (objWorkspace, funcCallback) {
                    if (objRequest.hasOwnProperty("fetchDelta") === true) {
                        console.log("fetching delta check");
                        chrome.storage.sync.get(['extensions.yt-engine.user'], function (data) {
                            data = data['extensions.yt-engine.user']
                            return funcCallback({lastSavedVideoDate: data['lastSavedVideoDate']});

                        })
                    } else {
                        chrome.storage.sync.set({
                            'history_fetched': false}, function () {
                        })
                        chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': 0}, function () {
                            return funcCallback({});
                        });
                    }
                },
                'objCookies': function (objArguments, funcCallback) {
                    var strCookies = ['SAPISID', '__Secure-3PAPISID'];
                    var objCookies = {};

                    var funcCookie = function () {
                        if (strCookies.length === 0) {
                            return funcCallback(objCookies);
                        }

                        var strCookie = strCookies.shift();

                        chrome.cookies.get({
                            'url': 'https://www.youtube.com',
                            'name': strCookie
                        }, function (objCookie) {
                            if (objCookie === null) {
                                objCookies[strCookie] = null;

                            } else if (objCookie !== null) {
                                objCookies[strCookie] = objCookie.value;
                            }

                            funcCookie();
                        });
                    };

                    funcCookie();
                },
                'objContauth': function (objArguments, funcCallback) {
                    var intTime = Math.round(new Date().getTime() / 1000.0);
                    var strCookie = objArguments.objCookies['SAPISID'] || objArguments.objCookies['__Secure-3PAPISID'];
                    var strOrigin = 'https://www.youtube.com';

                    crypto.subtle.digest('SHA-1', new TextEncoder().encode(intTime + ' ' + strCookie + ' ' + strOrigin))
                        .then(function (strHash) {
                            return funcCallback({
                                'strAuth': 'SAPISIDHASH ' + intTime + '_' + Array.from(new Uint8Array(strHash)).map(function (intByte) {
                                    return intByte.toString(16).padStart(2, '0')
                                }).join('')
                            });
                        });
                },
                'objVideos': function (objArguments, funcCallback) {
                    if (objArguments.strContinuation === undefined) {
                        objArguments.strContinuation = null;
                        objArguments.strClicktrack = null;
                        objArguments.objYtcfg = null;
                        objArguments.objYtctx = null;
                    }
                    if ((objArguments.strContinuation === null) || (objArguments.strClicktrack === null) || (objArguments.objYtcfg === null) || (objArguments.objYtctx === null)) {
                        fetch('https://www.youtube.com/feed/history', {
                            'credentials': 'include',
                            'headers': {
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Cache-Control': 'max-age=0',
                                'Connection': 'keep-alive',
                                'Host': 'www.youtube.com',
                                'Upgrade-Insecure-Requests': '1',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
                            },
                            'referrer': 'https://www.youtube.com/feed/history',
                            'referrerPolicy': 'no-referrer-when-downgrade',
                            'body': null,
                            'method': 'GET',
                            'mode': 'cors'
                        }).then(function (objResponse) {

                                return objResponse.text();
                            }
                        ).then(function (responseText) {
                                return parseHTML(objArguments, responseText, funcCallback);
                            }
                        );

                    } else if ((objArguments.strContinuation !== null) && (objArguments.strClicktrack !== null) && (objArguments.objYtcfg !== null) && (objArguments.objYtctx !== null)) {
                        console.log("else if");

                        objArguments.objYtctx['client']['screenWidthPoints'] = 1024;
                        objArguments.objYtctx['client']['screenHeightPoints'] = 768;
                        objArguments.objYtctx['client']['screenPixelDensity'] = 1;
                        objArguments.objYtctx['client']['utcOffsetMinutes'] = -420;
                        objArguments.objYtctx['client']['userInterfaceTheme'] = 'USER_INTERFACE_THEME_LIGHT';

                        objArguments.objYtctx['request']['internalExperimentFlags'] = [];
                        objArguments.objYtctx['request']['consistencyTokenJars'] = [];

                        fetch('https://www.youtube.com/youtubei/v1/browse?key=' + objArguments.objYtcfg['INNERTUBE_API_KEY'], {
                            'credentials': 'include',
                            "method": "POST",
                            'headers': {
                                'Accept': '*/*',
                                'Accept-Language': 'en-US,en;q=0.9',
                                "Authorization": objArguments.objContauth.strAuth,
                                'X-Goog-AuthUser': '0',
                                'X-Goog-PageId': objArguments.objYtcfg['DELEGATED_SESSION_ID'],
                                'X-Goog-Visitor-Id': objArguments.objYtctx['client']['visitorData'],
                                'Cache-Control': 'max-age=0',
                                'Connection': 'keep-alive',
                                'Content-Type': 'application/json',
                                'Host': 'www.youtube.com',
                                'Origin': 'https://www.youtube.com',
                                'Referer': 'https://www.youtube.com/feed/history',
                                'Sec-Fetch-Mode': 'cors',
                                'Sec-Fetch-Site': 'same-origin',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
                                'X-YouTube-Client-Name': '1'

                            },
                            'referrer': 'https://www.youtube.com/feed/history',
                            'referrerPolicy': 'no-referrer-when-downgrade',
                            'body': JSON.stringify({
                                'context': {
                                    'client': objArguments.objYtctx['client'],
                                    'request': objArguments.objYtctx['request'],
                                    'user': {},
                                    'clickTracking': {
                                        'clickTrackingParams': objArguments.strClicktrack
                                    }
                                },
                                'continuation': objArguments.strContinuation
                            }),
                        }).then(function (objResponse) {

                                return objResponse.text();
                            }
                        ).then(function (responseText) {

                            parseHTML(objArguments, responseText, funcCallback);

                        }).catch(function (error) {
                            console.error(error);
                        });
                    }

                    if (objArguments.strContinuation !== null) {
                        objArguments.strContinuation = null;
                    }

                },
                'objIncreaseFetch': function (objArguments, funcCallback) {
                    var videosLength = objArguments.objVideos.length
                    chrome.storage.sync.get(['extensions.yt-engine.fetchedVideos'], function (data) {
                        if (Object.keys(data).length === 0) {
                            console.log("No data");
                            data['extensions.yt-engine.fetchedVideos'] = 0
                        }
                        const newVideoLength = videosLength + data['extensions.yt-engine.fetchedVideos']
                        chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': newVideoLength}, function () {
                            // console.log("added")
                            return funcCallback({'count': newVideoLength});
                        });
                    })
                },
                'objContinuation': function (objArguments, funcCallback) {
                    const youtubeHistoryResult = objArguments.objVideos.reduce(function (r, a) {
                        r[a.date] = r[a.date] || [];
                        r[a.date].push(a.video_id);
                        return r;
                    }, Object.create(null));

                    objArguments.objVideos = [];


                    if (objArguments.objIncreaseFetch.count < objRequest.intThreshold) {
                        if (objArguments.strContinuation !== null) {

                            updateHtml()

                            save_history(youtubeHistoryResult)
                                .then(r => {
                                        send_message("get_history",
                                            function (response) {
                                                if (objArguments.checkUser.lastSavedVideoDate !== null) {

                                                    const lastSavedVideoDate = new Date(objArguments.checkUser.lastSavedVideoDate)
                                                    const lastWatchedVideo = new Date(Object.keys(youtubeHistoryResult).sort()[0])

                                                    if (lastWatchedVideo <= lastSavedVideoDate) {
                                                        console.log("Stop fetching, last watched video is older than last saved video")
                                                        return funcCallback({}, 'objDeltaFinished');
                                                    }
                                                    return funcCallback({}, 'objContauth');
                                                }

                                            })
                                        return funcResponse({'status': 'running', 'message': 'Keep fetching'});
                                    }
                                )
                        } else {
                            return funcCallback({}, 'objFinished');
                        }
                    } else {

                        save_history(youtubeHistoryResult).then(r => {
                                return funcCallback({}, 'objFinished');
                            }
                        ).catch(e => {
                            console.error(e)
                        })

                        return funcCallback({}, 'objFinished');
                    }


                },
                'objFinished': function (objArguments, funcCallback) {
                    chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': 0}, function () {
                    })
                    chrome.storage.sync.set({'history_fetched': true}, function () {
                    })

                    mark_history_fetched().then(r => {
                        return funcResponse({});
                    })
                }
                ,
                'objDeltaFinished': function (objArguments, funcCallback) {
                    chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': 0}, function () {
                        return funcCallback({});
                    })
                }

            },
            function (objArguments) {
                if (objArguments === null) {
                    funcResponse({"asdf": "asdf"});
                } else if (objArguments !== null) {

                    funcResponse({"objArguments": "done"})
                }
            });
    },


};
//
// Youtube.synchronize({
//     'intThreshold': 512
// }, function (objResponse) {
//     console.log('synchronized youtube');
// });


// Youtube.synchronize({
//     'intThreshold': 1000
// }, function (objData) {
//     console.log("objData")
// })
