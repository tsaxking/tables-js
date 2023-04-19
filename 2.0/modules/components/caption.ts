class TableCaption extends TableElement {
    #content:string|HTMLElement|number;
    constructor(caption:string|HTMLElement|number) {
        const el = document.createElement('caption');
        super(el);

        if (caption) {
            this.content = caption;
        }
        this.#content = caption;
    }

    get content() {
        return this.#content;
    }

    set content(caption:HTMLElement|string|number) {
        if (typeof caption === 'string' || typeof caption === 'number') {
            this.el.innerHTML = caption.toString();
        }
        else if (caption instanceof HTMLElement) {
            this.el.appendChild(caption);
        }

        this.#content = caption;
    }
}