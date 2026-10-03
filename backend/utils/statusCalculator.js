/**
 * Reusable backend utility to compute automated project status based on dates and progress percentage
 */
const calculateProjectStatus = (startDate, expectedCompletion, currentProgress) => {
    // Rule 1: If progress is 100%, status is COMPLETED
    if (Number(currentProgress) >= 100) {
        return 'COMPLETED';
    }

    const start = new Date(startDate).getTime();
    const completion = new Date(expectedCompletion).getTime();
    const now = new Date().getTime();

    // If project hasn't started yet or invalid dates
    if (isNaN(start) || isNaN(completion) || completion <= start) {
        return 'ON_TRACK';
    }

    // Calculate percentage of time elapsed
    const totalDuration = completion - start;
    const timeElapsed = now - start;

    if (timeElapsed <= 0) {
        return 'ON_TRACK'; // Hasn't started yet
    }

    const expectedProgress = Math.min(100, (timeElapsed / totalDuration) * 100);
    const diff = expectedProgress - currentProgress;

    // Comparison thresholds:
    // If progress is within 10% of expected progress or ahead: ON_TRACK
    // If progress is between 10% and 25% behind: DELAYED
    // If progress is more than 25% behind or deadline passed: CRITICAL
    if (now > completion && currentProgress < 100) {
        return 'CRITICAL';
    }

    if (diff <= 10) {
        return 'ON_TRACK';
    } else if (diff <= 25) {
        return 'DELAYED';
    } else {
        return 'CRITICAL';
    }
};

module.exports = { calculateProjectStatus };
