const fs = require('fs');

function getDateWithMonthAndDay(dayMonth) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    const date = new Date();
    const month = months.indexOf(dayMonth[0].toLowerCase());
    const day = parseInt(dayMonth[1]);
    date.setMonth(month);
    date.setDate(day);
    return date;
}

// dateDay might be of pattern: today, yesterday, sunday, Oct 13, 'Oct 13, 2021'
function stringDateToDate(dateDay) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const date = new Date();
    const day = dateDay.toLowerCase();

    if (day === "today") {
        return date.getTime();
    } else if (day === "yesterday") {
        const yesterday = date.setDate(date.getDate() - 1);
        return yesterday.getTime();
    } else if (days.includes(day)) {
        const dayIndex = days.indexOf(day);
        date.setDate(date.getDate() - (date.getDay() - dayIndex));
        return date.getTime();
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
                return d.getTime();
            }
        }
        const dayMonth = dateDay.split(" ");
        if (dayMonth.length === 2) {
            return getDateWithMonthAndDay(dayMonth).getTime();
        }
    }
}

fs.readFile("./history.html", 'utf8', (err, data) => {
    if (err) throw err;
    let strRegex = null;


    const objVideo = new RegExp(
        '("videoRenderer":)([^"]*)("videoId":)([^"]*)(")([^"]{11})(")(.*?)("text")([^"]*)(")([^"]*)(.*?)(")(.*?)(")', 'g');

    const matchDayVideo = new RegExp(
        '("itemSectionRenderer")(.*?)("header":)(.*?)("text"|"simpleText")([^"]*)(")([^"]*)(.*?)(")', 'g');
    // itemSectionRenderer
    const videoObjArray = [];
    while ((strRegex = matchDayVideo.exec(data)) !== null) {

        const dateDay = strRegex[8];
        const other = strRegex[0];
        while ((strRegex = objVideo.exec(other)) !== null) {

            const beforeStrTitle = strRegex[12];
            const afterStrTitle = beforeStrTitle.split('\\u0022')
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
                .join('>')
            console.log(beforeStrTitle)
            console.log(afterStrTitle)


            // const videosObj = {ideosObj);
        }
    }
});
