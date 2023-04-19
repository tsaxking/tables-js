class TableBody extends TableElement {
    #head?:TableHead;
    rows:TableRow[];
    table:Table_v2;

    constructor(table:Table_v2) {
        const el = document.createElement('tbody');
        super(el);

        this.rows = [];
        this.table = table;
    }

    set head(header:TableHead|undefined) {
        this.#head = header;
    }

    get head():TableHead|undefined {
        return this.#head;
    }

    addRow(...cells:(string|HTMLElement|number)[]):TableRow {
        const newRow = new TableRow(this.table);
        this.rows.push(newRow);
        this.el.appendChild(newRow.el);

        newRow.addCells(...cells);

        return newRow;
    }

    addRows(...rows:(string|HTMLElement)[][]):TableRow[] {
        return rows.map(row => {
            return this.addRow(...row);
        });
    }
}