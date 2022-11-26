window.addEventListener("click", onClickOutside);
document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("logout").addEventListener("click", logout);
document.getElementById("loadHistory").addEventListener("click", loadHistory);
document.getElementById("modalBtn").addEventListener("click", loadHistoryModal);

function onClickOutside() {
    var modal = document.getElementById('modal1');
    var loadHistory = document.getElementById('loadHistory');
    window.onclick = function (event) {
        if (event.target === loadHistory) {
            return
        }
        if (modal.style.display === "block") {
            if (event.target.parentNode !== modal && event.target.parentNode.parentNode !== modal
                && event.target.parentNode.parentNode.parentNode !== modal) {
                modal.style.display = "none";
            }
        }

    }
}


function loadHistoryModal() {
    var modal = document.getElementById('modal1');
    modal.style.display = 'none';
    resetFetchedStartingTime()
    chrome.runtime.sendMessage({message: "loadHistory"}, function (response) {

    });
    document.getElementById("loadHistory").style = "pointer-events: none; cursor: default; text-decoration: none; margin-bottom: 10px;" +
        "    margin-bottom: 10px;\n" +
        "    color: rgb(0 0 0 / 60%);\n" +
        "    box-shadow: none;\n" +
        "    background-color: rgba(0, 0, 0, 0.12);\n" +
        "    font-family: Roboto, Helvetica, Arial, sans-serif;\n" +
        "    font-weight: 200;"
    document.getElementById("loading-parent").style.display = "block";
    document.getElementById("loading2").innerHTML = "Loading ...";
}

function resetFetchedStartingTime() {
    chrome.storage.sync.set({'extensions.yt-engine.fetchedStartingTime': new Date().getTime()}, function () {
    })
}

function fetchDelta() {

    chrome.storage.sync.get(['extensions.yt-engine.fetchedVideos'], function (result) {
        if (result['extensions.yt-engine.fetchedVideos'] === 0) {
            console.log("fetching delta")
            resetFetchedStartingTime();
            chrome.runtime.sendMessage({message: "fetchDelta"}, function (response) {
                console.log(response)
                if (response.no_cookies === true) {
                    document.getElementById("loadHistory").innerText = "Login to Youtube First";
                    document.getElementById("loadHistory").onclick = function () {
                        window.open("https://www.youtube.com")
                    }
                    document.getElementById("loadHistory").style = "pointer-events: auto; cursor: pointer; text-decoration: none; margin-bottom: 10px;"
                }

            })
            document.getElementById("loading-parent").style.display = "block";
            document.getElementById("loading2").innerHTML = "Loading ...";
        } else {
            chrome.storage.sync.get(['extensions.yt-engine.fetchedStartingTime'], function (result) {
                let date = new Date(result['extensions.yt-engine.fetchedStartingTime']);
                const twoHours = 2 * 60 * 60 * 1000;
                if (new Date().getTime() - date.getTime() > twoHours) {
                    chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': 0}, function () {
                        fetchDelta();
                    })
                }
            })
        }
    })

}

function welcomeUser(user) {
    chrome.storage.sync.get(['extensions.yt-engine.fetchedVideos'], function (result) {
            document.getElementById("username").innerHTML = "HI " + user.name;
            document.getElementById("logout").style.display = "block";
            document.getElementById("login").style.display = "none";
            document.getElementById("loadHistory").innerText = "Load History";

            if (user["isHistoryFetched"]) {

                document.getElementById("loadHistory").innerText = "Force Reload History";
                document.getElementById("loading-parent").style.display = "block";
                document.getElementById("loading2").innerHTML = "last updated: " + user["lastSavedVideoDate"];
            } else if (result["extensions.yt-engine.fetchedVideos"] > 0) {
                console.log(result["extensions.yt-engine.fetchedVideos"])
                document.getElementById("loadHistory").style = "pointer-events: none; cursor: default; text-decoration: none; margin-bottom: 10px;" +
                    "    margin-bottom: 10px;\n" +
                    "    color: rgb(0 0 0 / 60%);\n" +
                    "    box-shadow: none;\n" +
                    "    background-color: rgba(0, 0, 0, 0.12);\n" +
                    "    font-family: Roboto, Helvetica, Arial, sans-serif;\n" +
                    "    font-weight: 200;"
                document.getElementById("loading-parent").style.display = "block";
                document.getElementById("loading2").innerHTML = "Loading ...";
            } else {
                document.getElementById("loading-parent").style.display = "none";
                document.getElementById("loading2").innerHTML = "Loading...";
            }
        }
    )

}

function getUserFromBackend() {
    document.getElementById("progress").style.display = "block";
    document.getElementById("page").style.display = "none";
    document.getElementById("login").style.display = "none";
    fetch(BACKEND_URL + "/user", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
                if (response.status === 200) {
                    document.getElementById("progress").style.display = "none";
                    document.getElementById("page").style.display = "flex";

                    return response.json();
                } else if (response.status === 401) {
                    document.getElementById("progress").style.display = "none";
                    document.getElementById("login").style.display = "flex";
                    throw new Error("Not authorized");
                }
            }
        ).then((user) => {
        chrome.storage.sync.set({'extensions.yt-engine.user': user}, function () {
            if (user["isHistoryFetched"]) {
                fetchDelta();
            } else {
                chrome.storage.sync.get(['extensions.yt-engine.fetchedStartingTime'], function (result) {
                    let date = new Date(result['extensions.yt-engine.fetchedStartingTime']);
                    if (date === undefined) {
                        resetFetchedStartingTime();
                    } else {
                        const twoHours = 2 * 60 * 60 * 1000;
                        if (new Date().getTime() - date.getTime() > twoHours) {
                            chrome.storage.sync.set({'extensions.yt-engine.fetchedVideos': 0}, function () {
                            })
                        }
                    }
                })
            }
            welcomeUser(user);
        })
    }).catch((error) => {
        if (error.message === "Not authorized") {
            document.getElementById("login").style.display = "flex";
        } else {
            document.getElementById("progress").style.backgroundColor = "tan";

        }
    })
}

getUserFromBackend()


function login() {
    window.open(LOGIN_URL);
}


function loadHistory() {
    document.getElementById('modal1').style.display = 'block';
}


function logout() {
    document.getElementById("logout").innerText = "Logging out..."

    chrome.storage.sync.set({'extensions.yt-engine.user': null}, function () {
        fetch(BACKEND_URL + "/api" + "/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (response.status === 200) {
                    document.getElementById("main").style.display = "none";
                    document.getElementById("login").style.display = "flex";
                } else {
                    throw new Error("Something went wrong on api server!");
                }
            })
            .catch((error) => {
            })
    })

}

