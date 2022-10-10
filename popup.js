// When the button is clicked, inject setPageBackgroundColor into current page
searchBtn.addEventListener("click", async () => {
    console.log("asdf")
    var strToSearch = document.getElementById('searchInput').value;
    console.log(strToSearch)
    callBackend(strToSearch)
});

function callBackend(strToSearch) {


    var url = new URL('http://localhost:5500/search')
    var params = {q: strToSearch}
    url.search = new URLSearchParams(params).toString();
    fetch(url).then(function (response) {
        console.log(response)
    })


}


