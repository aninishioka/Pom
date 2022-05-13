function testCalcEndTime() {
    console.log(`now: ${new Date()}`);
    console.log(`in 10: ${new Date(calculateEndTime(10))}}`);
    console.log(`in 60: ${new Date(calculateEndTime(60))}}`);
    console.log(`in 75: ${new Date(calculateEndTime(75))}}`);
}

function testFormatTime() {
    console.log(`02:30 == ${formatTime(150000)}`);
    console.log(`00:05 == ${formatTime(5000)}`);
    console.log(`00:00 == ${formatTime(-5000)}`);
    console.log(`30:00 == ${formatTime(1800000)}`);
    console.log(`45:45 == ${formatTime(2745000)}`);
}

function testCalcTimeUntil() {
    console.log(`at 9:00, ${formatTime(calculateTimeUntil(1629432000000))}`);
    console.log(`at 9:15, ${formatTime(calculateTimeUntil(1629432900000))}`);
    console.log(`10:15, ${formatTime(calculateTimeUntil(1629436500000))}`);
} 