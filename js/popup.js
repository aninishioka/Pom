/*****to do: after timer finishes, show duration for next phase*****/
/*****to do: getPhaseDuration --> setPhaseDuration****/
/*****to do: user preferences*****/
/*****to do: when to reset work phase count for the  day? at midnight?*****/
/*****to do: phase keeps defaulting to short break? but sets to right time idk what's going on*****/

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

let workDuration = 10 * millisecsInASec; //25 * millisecsInAMin;
let shortBreak = 5 * millisecsInASec; //5 * millisecsInAMin;
let longBreak = 8 * millisecsInASec; //15 * millisecsInAMin;

document.addEventListener("DOMContentLoaded", () => {
    displayCountdown();
    displayTimerStatus(); /*****for debugging*****/
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
            displayCountdown();
            displayTimerStatus();  //for debugging
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
        displayCountdown();
        chrome.runtime.sendMessage({"task":"set-alarm"});
    });
}

function resetTimer() {
    chrome.runtime.sendMessage({"task": "reset-alarm"});
    setTimerStatus(status.off);
    stopCountdown();
    displayCountdown();
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
}

function displayCountdown() {
    storage.get(["timerStatus", "remainingTime", "pomPhase"], data => {
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
        displayTimerStatus();
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
function setPhase(curPomPhase, curPhaseCount) {
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