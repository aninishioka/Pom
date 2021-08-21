/**********init storage values on install?**********/

const storage = chrome.storage.sync;
const countdown = document.getElementById("countdown");
const start = document.getElementById("start");
const reset = document.getElementById("reset");
const millisecsInAMin = 60000;

let workDuration = 25;

document.addEventListener("DOMContentLoaded", () => {
    updateCountdown();
});

start.addEventListener("click", () => {
    initTimer();
});

reset.addEventListener("click", () => {

});

function initTimer() {
    //init values in storage: endTime, workDuration and start countdown
    let endTime = calculateEndTime(workDuration);
    storage.set({"endTime": endTime, "workDuration": workDuration}, () => {
        console.log(`endTime set to ${endTime}`);
        console.log(`workDuration set to ${workDuration}`);
        updateCountdown();
    });
}

//calculates end time in milliseconds since Unix Epoch
function calculateEndTime(duration) {
    let now = new Date();
    let end = new Date(now.getTime() + millisecsInAMin * duration);
    return end.getTime();
}

//calculate and display time remaining 
function updateCountdown() {
    storage.get("endTime", data => {
        console.log(`endTime retrieved from storage is ${data.endTime}`)
        let diff = calculateTimeUntil(data.endTime);
        updateCountdownString(formatTime(diff));
    });

    setTimeout(updateCountdown,500);
}

//time difference in milliseconds
function calculateTimeUntil(endTime) {
    let now = new Date().getTime();
    let diff = endTime - now;
    return diff;
}

function updateCountdownString(newCountdown) {
    countdown.textContent = `${newCountdown}`;
}

//formats time in mm:ss
function formatTime(millisecs) {
    if (millisecs <= 0) return "00:00";

    let minutes = Math.floor(millisecs / (60 * 1000));
    let seconds = Math.floor((millisecs % (60 * 1000)) / 1000);

    let minutesString = (minutes < 10) ? "0" + minutes : `${minutes}`;
    let secondsString = (seconds < 10) ? "0" + seconds : `${seconds}`;

    return `${minutesString}:${secondsString}`;
}

