class TableHead extends TableElement {
    #body?:TableBody;
    table:Table_v2;
    row:TableRow;
    columns:TableColumn[];

    constructor(table:Table_v2) {
        const el = document.createElement('thead');
        super(el);
        this.table = table;

        this.row = new TableRow(table);
        this.el.appendChild(this.row.el);

        this.columns = [];
    }

    addHeader(content:string|HTMLElement, options?:ColumnOptions):TableHeaderCell {
        const th = new TableHeaderCell(content, this.table);
        this.row.addCell(th);

        const column = new TableColumn(options, this.row.cells.length - 1, this);
        this.columns.push(column);

        return th;
    }

    get body() {
        return this.#body;
    }

    set body(body) {
        if (!(body instanceof TableBody)) {
            throw new Error('The body must be an instance of TableBody');
        }

        this.#body = body;
        this.#body.head = this;
    }
}