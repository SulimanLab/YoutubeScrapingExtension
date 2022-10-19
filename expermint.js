// read experiment data from a file
const fs = require('fs');

fs.readFile("./history.html", 'utf8', (err, data) => {
    if (err) throw err;
    // console.log(data)
    let strRegex = null;
    // ("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")
    // const objVideo = new RegExp(
    //     '("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")(.*?)("header":)(.*?)("text")([^"]*)(")([^"]*)(.*?)(")', 'g');

    // match objVideo until you fine the first "header" and then stop
    // const objVideo = new RegExp(
    //     '("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")', 'g');


    const objVideo = new RegExp(
        '("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")(.*?)(")', 'g');

    const matchDayVideo = new RegExp(
        '("itemSectionRenderer")(.*?)("header":)(.*?)("text"|"simpleText")([^"]*)(")([^"]*)(.*?)(")', 'g');
    // itemSectionRenderer
    while ((strRegex = matchDayVideo.exec(data)) !== null) {

        const date = strRegex[8];
        const other = strRegex[0];
        while ((strRegex = objVideo.exec(other)) !== null) {
            console.log("date = " + date)
            console.log("video = " + strRegex[6])
            console.log("title = " + strRegex[12])
        }
    }
});
