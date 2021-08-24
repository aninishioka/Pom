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
    storage.set({"timerStatus": status.off, "pomPhase": phase.work, "phaseCount": 1})
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.task == "set-alarm") setAlarm();
    else if (message.task == "reset-alarm") resetAlarm();
    else if (message.task == "pause-alarm") pauseAlarm();
});

function setAlarm() {
    /*****to do: better name for alarm*****/
    storage.get("endTime", data => {
        chrome.alarms.create("alarm", {when: data.endTime});
    });
}

chrome.alarms.onAlarm.addListener(alarm => {
    createNotification();
    resetAlarm();
    setPhase();
});

function createNotification() {
    chrome.notifications.create(
        {
            type: "basic",
            title: "countdown over",
            message: "countdown over beep beep",
            iconUrl: "assets/get_started48.png",  
        }
    );
}

function resetAlarm() {
    chrome.alarms.clear("alarm");
    storage.set({"timerStatus": status.off});
}

function pauseAlarm() {
    chrome.alarms.clear("alarm");
}

function setPhase() {
    storage.get(["pomPhase", "phaseCount"], data =>  {
        let newCount = data.phaseCount + 1;
        let newPhase = (data.pomPhase != phase.work)? phase.work : (newCount % cycleLength == 0)? phase.longBreak : phase.shortBreak;
        storage.set({"pomPhase": newPhase, "phaseCount": newCount});
        printPhase(newPhase, newCount); //for debugging
    });
}

/*****for debugging*****/
function printPhase(curPhase, count) {
    let phaseString = (curPhase == phase.work)? "work": (curPhase == phase.shortBreak)? "short break" : "long break";
    console.log(`${count}: ${phaseString}`);
}
