getUserFromBackend()


document.getElementById("login").addEventListener("click", openPage);
document.getElementById("logout").addEventListener("click", logout);
document.getElementById("loadHistory").addEventListener("click", loadHistory);

function getUserFromBackend() {

    fetch(BACKEND_URL + ":5500" + "/user", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                document.getElementById("main").style.display = "none";
                document.getElementById("login").style.display = "block";
                throw new Error("Something went wrong on api server!");
            }
        })
        .then((user) => {
            document.getElementById("username").innerHTML = "HI " + user.name;
            document.getElementById("logout").style.display = "block";
            document.getElementById("login").style.display = "none";

        }).catch((error) => {
    })
}

function openPage() {
    window.open(BACKEND_URL + ":3000");
}

function dd(response, resolve, reject) {
    setTimeout(() => {
        if (response.complete) {
            resolve();
        } else {
            reject('Something wrong');
        }
    }, 100000)

}

function loadHistory() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({greeting: "dd", cccc: new XMLHttpRequest()}, function (response) {
            console.log(response)
            if (response === undefined) {
                dd(response, resolve, reject)
            }


        });
    });

    // loadHistoryFunc(dd);
}

function logout() {
    document.getElementById("logout").innerText = "Logging out..."
    fetch(BACKEND_URL + ":5500" + "/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (response.status === 200) {
                document.getElementById("main").style.display = "none";
                document.getElementById("login").style.display = "block";
            } else {
                throw new Error("Something went wrong on api server!");
            }
        })
        .catch((error) => {
            console.log(error)
        })
}

