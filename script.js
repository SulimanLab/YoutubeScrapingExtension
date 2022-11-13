window.addEventListener("click", onClickOutside);
document.getElementById("loginBtn").addEventListener("click", openPage);
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


function fetchDelta() {
    chrome.storage.sync.get(['extensions.yt-engine.fetchedVideos'], function (result) {
        if (result['extensions.yt-engine.fetchedVideos'] === 0) {
            console.log("fetching delta")
            chrome.runtime.sendMessage({message: "fetchDelta"}, function (response) {
                document.getElementById("loadHistory").style = "waves-effect btn accent-3";
            })
        } else {
            console.log("fetching in progress, please wait")
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
    fetch(BACKEND_URL + ":5500" + "/user", {
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


function openPage() {
    window.open(BACKEND_URL + ":3000");
}


function loadHistory() {
    document.getElementById('modal1').style.display = 'block';
}

function loadHistoryModal() {
    var modal = document.getElementById('modal1');
    modal.style.display = 'none';
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


function logout() {
    document.getElementById("logout").innerText = "Logging out..."

    chrome.storage.sync.set({'extensions.yt-engine.user': null}, function () {
        fetch(BACKEND_URL + ":5500" + "/logout", {
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

