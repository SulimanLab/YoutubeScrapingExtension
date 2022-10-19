// read experiment data from a file
const fs = require('fs');

fs.readFile("./history.html", 'utf8', (err, data) => {
    if (err) throw err;
    // console.log(data)
    let strRegex = null;
    var objContinuation = new RegExp('("continuationCommand":)([^"]*)("token":)([^"]*)(")([^"]*)(")', 'g');

    while ((strRegex = objContinuation.exec(data)) !== null) {
        console.log(strRegex[6]);
        break
    }




    // -------------------------------
    // const objVideo = new RegExp(
    //     '("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")(.*?)(")', 'g');
    //
    // const matchDayVideo = new RegExp(
    //     '("itemSectionRenderer")(.*?)("header":)(.*?)("text"|"simpleText")([^"]*)(")([^"]*)(.*?)(")', 'g');
    // // itemSectionRenderer
    // while ((strRegex = matchDayVideo.exec(data)) !== null) {
    //
    //     const date = strRegex[8];
    //     const other = strRegex[0];
    //     while ((strRegex = objVideo.exec(other)) !== null) {
    //         console.log("date = " + date)
    //         console.log("video = " + strRegex[6])
    //         console.log("title = " + strRegex[12])
    //     }
    // }
});
