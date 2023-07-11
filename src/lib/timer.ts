/**
 * Timer calculates the time difference between the start time and 
 * the time when the resolve() method is called (in milliseconds).
 * 
 * ```ts
 * let timer = new Timer();
 * setTimeout(()= console.log(timer.resolve(), 'ms'), 1000);
 * ```
 */
export class Timer {
    private _timeStart: number;
    constructor() {
        this._timeStart = new Date().valueOf()
    }
    /**
     * @returns {number} The number of milliseconds between the start time and the current time.  
     */
    public resolve(): number {
        return (new Date()).valueOf() - this._timeStart
    }
}