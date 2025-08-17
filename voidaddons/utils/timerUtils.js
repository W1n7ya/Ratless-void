class timerUtils {
    constructor() {
        this.startTime = Date.now();
    }
    hasReached(time) {
        if (Date.now() - this.startTime > time) return true
        return false
    }
    getTimePassed() {
        return Date.now() - this.startTime
    }
    reset() {
        this.startTime = Date.now();
    }
}
export default timerUtils;