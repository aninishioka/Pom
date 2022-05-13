function testSetPhase() {
    console.log(`got: ${setPhase(phase.work, 1)}. expected: 2: short break`);
    console.log(`got: ${setPhase(phase.shortBreak, 2)}. expected: 3: work`);
    console.log(`got: ${setPhase(phase.work, 7)}. expected: 8: long break`);
}