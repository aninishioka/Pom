const storage = chrome.storage.sync;
const status = {
    off: 0,
    on: 1,
    paused: 2
};
const phase = {
    work: 0, 
    shortBreak: 1,
    longBreak: 2
};
const cycleLength = 8;

chrome.runtime.onInstalled.addListener(() => {
    storage.set({"timerStatus": status.off, "pomPhase": phase.work, "phaseCount": 0})
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.task == "set-alarm") setAlarm();
    else if (message.task == "reset-alarm") resetAlarm();
    else if (message.task == "pause-alarm") pauseAlarm();
});

function setAlarm() {
    /*****to do: better name for alarm*****/
    storage.get(["endTime", "pomPhase"], data => {
        chrome.alarms.create("alarm", {when: data.endTime});
        setTooltipIcon(status.on, data.pomPhase);
        incrementPhaseCount();
    });
}

chrome.alarms.onAlarm.addListener(alarm => {
    createNotification();
    resetAlarm();
    setNextPhase();
});

function createNotification() {
    chrome.notifications.create(
        {
            type: "basic",
            title: "countdown over",
            message: "countdown over beep beep",
            iconUrl: "assets/get_started48.png", 
            requireInteraction: true 
        }
    );
}

function resetAlarm() {
    chrome.alarms.clear("alarm");
    storage.set({"timerStatus": status.off});
    setTooltipIcon(status.off, null);
}

function pauseAlarm() {
    chrome.alarms.clear("alarm");
}

function setNextPhase() {
    storage.get(["pomPhase", "phaseCount"], data =>  {
        let nextCount = data.phaseCount + 1;
        let nextPhase = (data.pomPhase != phase.work)? phase.work : (nextCount % cycleLength  == 0)? phase.longBreak : phase.shortBreak;
        //storage.set({"pomPhase": newPhase, "phaseCount": newCount});
        storage.set({"pomPhase": nextPhase});
        //printPhase(nextPhase, nextCount); //for debugging
    });
}

function incrementPhaseCount() {
    storage.get("phaseCount", data => {
        storage.set({"phaseCount": data.phaseCount + 1});
    });
}

function setTooltipIcon(curStatus, curPhase) {
    let iconPath  = (curStatus == status.off)? "assets/off_16.png" :  (curPhase == phase.work)? "assets/work_16.png" : "assets/break_16.png";
    console.log(iconPath);
    chrome.action.setIcon({"path": iconPath});
}

/*****for debugging*****/
function printPhase(curPhase, count) {
    let phaseString = (curPhase == phase.work)? "work": (curPhase == phase.shortBreak)? "short break" : "long break";
    console.log(`${count}: ${phaseString}`);
}
