type CallbackFunction = (event: Event) => void;

class TableListener {
    event:string;
    callback:CallbackFunction;

    constructor(event:string, callback:CallbackFunction) {
        this.event = event;
        this.callback = callback;
    }
}