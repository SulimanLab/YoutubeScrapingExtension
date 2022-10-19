chrome.alarms.create('synchronize',
    {periodInMinutes: 11111}
);


var funcHackyparse = function (strJson) {
    for (var intLength = 1; intLength < strJson.length; intLength += 1) {
        if (strJson[intLength - 1] !== '}') {
            continue;
        }

        try {
            return JSON.parse(strJson.substr(0, intLength));
        } catch (objError) {
            // ...
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

// ##########################################################


chrome.alarms.onAlarm.addListener(function (objAlarm) {
    if (objAlarm.name === 'synchronize') {
        Youtube.synchronize({
            'intThreshold': 512
        }, function (objResponse) {
            console.log('synchronized youtube');
        });
    }
});

var Youtube = {
    synchronize: function (objRequest, funcResponse) {
        Node.series(
            {
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

                    // https://stackoverflow.com/a/32065323

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

                    var objAjax = new XMLHttpRequest();
                    objAjax.onload = function () {
                        if (objArguments.objYtcfg === null) {
                            objArguments.objYtcfg = funcHackyparse(objAjax.responseText.split('ytcfg.set(').find(function (strData) {
                                return strData.indexOf('INNERTUBE_API_KEY') !== -1;
                            }).slice(0, -2));
                        }

                        if (objArguments.objYtctx === null) {
                            objArguments.objYtctx = funcHackyparse(objAjax.responseText.split('"INNERTUBE_CONTEXT":')[1]);
                        }

                        var strRegex = null;
                        var objContinuation = new RegExp('("continuationCommand":)([^"]*)("token":)([^"]*)(")([^"]*)(")', 'g');
                        var objClicktrack = new RegExp('("continuationEndpoint":)([^"]*)("clickTrackingParams":)([^"]*)(")([^"]*)(")', 'g');
                        var objVideo = new RegExp('("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(")', 'g');

                        var strUnescaped = objAjax.responseText.split('\\"').join('\\u0022').split('\r').join('').split('\n').join('');

                        if ((strRegex = objContinuation.exec(strUnescaped)) !== null) {
                            objArguments.strContinuation = strRegex[6];
                        }

                        if ((strRegex = objClicktrack.exec(strUnescaped)) !== null) {
                            objArguments.strClicktrack = strRegex[6];
                        }

                        var objVideos = [];


                        while ((strRegex = objVideo.exec(strUnescaped)) !== null) {
                            var strIdent = strRegex[6];
                            var strTitle = strRegex[12];

                            strTitle = strTitle.split('\\u0022').join('"');
                            strTitle = strTitle.split('\\u0026').join('&');
                            strTitle = strTitle.split('\\u003C').join('<');
                            strTitle = strTitle.split('\\u003C').join('=');
                            strTitle = strTitle.split('\\u003E').join('>');
                            strTitle = strTitle.split('\\u003E').join('>');
                            // console.log(strTitle)
                            objVideos.push({
                                'strIdent': strIdent,
                                'intTimestamp': null,
                                'strTitle': strTitle,
                                'intCount': null
                            });
                        }
                        return funcCallback(objVideos);
                    };

                    if ((objArguments.strContinuation === null) || (objArguments.strClicktrack === null) || (objArguments.objYtcfg === null) || (objArguments.objYtctx === null)) {
                        objAjax.open('GET', 'https://www.youtube.com/feed/history');

                        objAjax.send();

                    } else if ((objArguments.strContinuation !== null) && (objArguments.strClicktrack !== null) && (objArguments.objYtcfg !== null) && (objArguments.objYtctx !== null)) {
                        objAjax.open('POST', 'https://www.youtube.com/youtubei/v1/browse?key=' + objArguments.objYtcfg['INNERTUBE_API_KEY']);

                        objAjax.setRequestHeader('Authorization', objArguments.objContauth.strAuth);
                        objAjax.setRequestHeader('Content-Type', 'application/json');
                        objAjax.setRequestHeader('X-Origin', 'https://www.youtube.com');
                        objAjax.setRequestHeader('X-Goog-AuthUser', '0');
                        objAjax.setRequestHeader('X-Goog-PageId', objArguments.objYtcfg['DELEGATED_SESSION_ID']);
                        objAjax.setRequestHeader('X-Goog-Visitor-Id', objArguments.objYtctx['client']['visitorData']);

                        objArguments.objYtctx['client']['screenWidthPoints'] = 1024;
                        objArguments.objYtctx['client']['screenHeightPoints'] = 768;
                        objArguments.objYtctx['client']['screenPixelDensity'] = 1;
                        objArguments.objYtctx['client']['utcOffsetMinutes'] = -420;
                        objArguments.objYtctx['client']['userInterfaceTheme'] = 'USER_INTERFACE_THEME_LIGHT';

                        objArguments.objYtctx['request']['internalExperimentFlags'] = [];
                        objArguments.objYtctx['request']['consistencyTokenJars'] = [];

                        objAjax.send(JSON.stringify({
                            'context': {
                                'client': objArguments.objYtctx['client'],
                                'request': objArguments.objYtctx['request'],
                                'user': {},
                                'clickTracking': {
                                    'clickTrackingParams': objArguments.strClicktrack
                                }
                            },
                            'continuation': objArguments.strContinuation
                        }));

                    }

                    if (objArguments.strContinuation !== null) {
                        objArguments.strContinuation = null;
                    }
                },
                'objIncreaseFetch': function (objArguments, funcCallback) {
                    var videosLength = objArguments.objVideos.length
                    chrome.storage.sync.get(['extensions.yt-engine.fetchedVideos'], function (data) {
                        if (Object.keys(data).length === 0) {
                            data['extensions.yt-engine.fetchedVideos'] = 0
                        }
                        const newVideoLength = videosLength + data['extensions.yt-engine.fetchedVideos']
                        chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': newVideoLength}, function () {
                            console.log("added")
                            return funcCallback({'count': newVideoLength});
                        });
                    })
                },
                'objContinuation': function (objArguments, funcCallback) {
                    if (objRequest.hasOwnProperty("intThreshold") === false) {
                        console.log("no objArguments.intThreshold")
                        console.log("objArguments.count")
                        console.log(objArguments)
                        objRequest.intThreshold = 0
                    }
                    if (objArguments.objIncreaseFetch.count < objRequest.intThreshold) {
                        console.log("objArguments.count < objArguments.intThreshold" + objArguments.count < objArguments.intThreshold)
                        if (objArguments.strContinuation !== null) {
                            return funcCallback({}, 'objContauth');
                        }
                    }
                    chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos2': 0}, function () {

                    })


                    return funcCallback({});
                }

            }, function (objArguments) {
                if (objArguments === null) {
                    funcResponse(null);

                } else if (objArguments !== null) {
                    funcResponse({});

                }
            });
    },


};

Youtube.synchronize({
    'intThreshold': 512
}, function (objResponse) {
    console.log('synchronized youtube');
});
