const storage = chrome.storage.sync;
const countdown = document.getElementById("countdown");
const start = document.getElementById("start");
const pause  = document.getElementById("pause");
const reset = document.getElementById("reset");
const millisecsInAMin = 60000;
const millisecsInASec = 1000;
const countdownTimeout = {
    setUp: function() {
        this.timeout = setTimeout(updateCountdown,1000);
    },

    clear: function() {
        clearTimeout(this.timeout);
    }
}
const status = {
    off: 0,
    on: 1,
    paused: 2
}
const phase = {
    work: 0,
    shortBreak: 1,
    longBreak: 2
}
const cycleLength = 8;
const popupColors = {
    off: "#2F2F2F",
    work: "#EA4F49",
    break: "#49C199"
}

let workDuration = 25 * millisecsInAMin; 
let shortBreak = 5 * millisecsInAMin; 
let longBreak = 15 * millisecsInAMin;

/*****for debugging*****/
/*let workDuration = 10 * millisecsInASec; 
let shortBreak = 5 * millisecsInASec;
let longBreak = 8 * millisecsInASec;*/

document.addEventListener("DOMContentLoaded", () => {
    updateDisplay();
    //displayTimerStatus(); /*****for debugging*****/
});

start.addEventListener("click", () => {
    storage.get("timerStatus", data => {
        if (data.timerStatus == status.off) initTimer();
        else if (data.timerStatus == status.paused) resumeTimer();
    });
});

pause.addEventListener("click", () => {
    storage.get("timerStatus", data => {
        if (data.timerStatus == status.on) pauseTimer();
    });
});

reset.addEventListener("click", () => {
    storage.get("timerStatus", data => {
        if (data.timerStatus != status.off) resetTimer();
    });  
});

function initTimer() {
    storage.get(["pomPhase", "phaseCount"], data => { 
        let duration = getPhaseDuration(data.pomPhase); //to do: clean up code
        let endTime = calculateEndTime(duration);
        storage.set({"endTime": endTime, "timerStatus": status.on}, () => {
            updateDisplay();
            //displayTimerStatus();  //for debugging
            chrome.runtime.sendMessage({"task": "set-alarm"});
        });
    })

    /*let endTime = calculateEndTime(workDuration);
    storage.set({"endTime": endTime, "workDuration": workDuration, "timerStatus": status.on}, () => {
        displayCountdown();
        displayTimerStatus();  //for debugging
        chrome.runtime.sendMessage({"task": "set-alarm"});
    });*/
}

function pauseTimer() {
    setRemainingTime();
    setTimerStatus(status.paused);
    stopCountdown();
    chrome.runtime.sendMessage({"task":"pause-alarm"});
}

function resumeTimer() {
    setTimerStatus(status.on);
    storage.get("remainingTime", data => {
        let newEndTime = calculateEndTime(data.remainingTime);
        storage.set({"endTime": newEndTime});
        updateDisplay();
        chrome.runtime.sendMessage({"task":"set-alarm"});
    });
}

function resetTimer() {
    chrome.runtime.sendMessage({"task": "reset-alarm"});
    setTimerStatus(status.off);
    stopCountdown();
    updateDisplay();
}

function stopCountdown() {
    countdownTimeout.clear();
}

function setRemainingTime() {
    storage.get("endTime", data => {
        let remainingTime = calculateTimeUntil(data.endTime);
        storage.set({"remainingTime": remainingTime});
    });
}

//takes duration in millisecs and calculates end time in milliseconds since Unix Epoch
function calculateEndTime(duration) {
    let now = new Date();
    let end = new Date(now.getTime() + duration);
    return end.getTime();
}3

function updateDisplay() {
    storage.get(["timerStatus", "remainingTime", "pomPhase"], data => {
        setPopupColor(data.timerStatus, data.pomPhase);
        if (data.timerStatus == status.on) {
            updateCountdown();
        } else if (data.timerStatus ==  status.paused) {
            setCountdownString(data.remainingTime);
        } else if (data.timerStatus == status.off)  {
            setCountdownString(getPhaseDuration(data.pomPhase));
        }
    });
}

function setTimerStatus(timerStatus) {
    storage.set({"timerStatus": timerStatus}, () => {
        console.log(`timerStatus set to ${timerStatus}`);
        //displayTimerStatus();
    });
}

/*****for debugging*****/
function displayTimerStatus() {
    storage.get("timerStatus", data => {
        document.getElementById("status").textContent = data.timerStatus;
    });
}

//calculate and display countdown
function updateCountdown() {
    storage.get(["endTime", "timerStatus"], data => {
        let diff = calculateTimeUntil(data.endTime);
        setCountdownString(diff);
        if (data.timerStatus == status.on) countdownTimeout.setUp();
    });
}


//time difference in milliseconds
function calculateTimeUntil(endTime) {
    let now = new Date().getTime();
    let diff = endTime - now;
    return diff;
}

//takes input in millisecs and formats to mm:ss
function setCountdownString(newCountdown) {
    let formattedCountdown  = formatTime(newCountdown);
    countdown.textContent = `${formattedCountdown}`;
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

/*****remove?*****/
function setNextPhase(curPomPhase, curPhaseCount) {
    let newPomPhase;
    let newPhaseCount = curPhaseCount + 1;
    console.log(newPhaseCount);
    if (curPomPhase != phase.work) {
        newPomPhase = phase.work;
    } else if (newPhaseCount % cycleLength == 0) {
        newPomPhase = phase.longBreak;
    } else {
        newPomPhase = phase.shortBreak;
    }
    storage.set({"pomPhase": newPomPhase, "phaseCount": newPhaseCount});
    return newPomPhase;
}

function getPhaseDuration(pomPhase) {
    switch (pomPhase) {
        case phase.work:
            return workDuration;
        case phase.shortBreak:
            return shortBreak;
        case phase.longBreak:
            return longBreak;
    }
}

function setPopupColor(curStatus, curPhase) {
    let color = (curStatus == status.off)? popupColors.off: (curPhase == phase.work)? popupColors.work : popupColors.break;
    document.body.style.backgroundColor = color;
    let buttons = document.getElementsByTagName("button");
    for (button of buttons) {
        button.style.color = color;
    }
}