class TableElement {
    el:HTMLElement;
    listeners:TableListener[];
    events:{[key:string]:CallbackFunction};
    stack:Table_StateStack;
    #data:any;

    constructor(el:HTMLElement) {
        this.el = el;
        this.listeners = [];
        this.events = {};
        this.stack = new Table_StateStack();
    }

    public on(event:string, callback:CallbackFunction):void {
        if (typeof event !== 'string') {
            return console.error('Table.on() requires a string as the first argument.');
        }

        if (typeof callback !== 'function') {
            return console.error('Table.on() requires a function as the second argument.');
        }

        if (!this.events[event]) {
            this.events[event] = (e) => {
                return Promise.all(this.listeners.filter(l => {
                    return l.event === event;
                }).map(l => {
                    return l.callback(e);
                }));
            };

            this.el.addEventListener(event, this.events[event]);
        }

        this.listeners.push(new TableListener(event, callback));
    }

    public off(event?:string, callback?:CallbackFunction):void {
        if (!event) {
            Object.keys(this.events).forEach(event => {
                this.el.removeEventListener(event, this.events[event]);
                delete this.events[event];
            });

            this.listeners = [];
            return;
        }

        if (event && !callback) {
            this.listeners = this.listeners.filter(l => l.event !== event);
            delete this.events[event];
            return;
        }

        this.listeners = this.listeners.filter(l => {
            return l.event !== event || l.callback !== callback;
        });

        if (!this.listeners.filter(l => l.event === event).length) {
            this.el.removeEventListener(event, this.events[event]);
            delete this.events[event];
        }
    }

    set data(data:any) {
        this.#data = data;
    }

    get data() {
        return this.#data;
    }
}