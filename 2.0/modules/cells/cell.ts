class TableCell extends TableElement {
    table:Table_v2;
    #content:string|HTMLElement|number;

    constructor(content:string|HTMLElement|number, table:Table_v2) {
        const el = document.createElement('td');
        super(el);
        this.table = table;
        this.content = content;
        this.#content = content; // not necessary, but it's to trick the compiler
    }

    get content() {
        return this.#content;
    }

    set content(content:string|HTMLElement|number) {
        if (typeof content === 'string' || typeof content === 'number') {
            this.el.innerHTML = content.toString();
        }
        else if (content instanceof HTMLElement) {
            this.el.appendChild(content);
        }

        this.#content = content;
    }
}