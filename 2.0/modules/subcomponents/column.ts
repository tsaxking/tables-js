class TableColumn {
    options:ColumnOptions;
    index:number;
    header:TableHead;
    cells:TableCell[];

    constructor(options:ColumnOptions = {
        render: () => {},
        sort: () => {},
        filter: () => {}
    }, index:number, head:TableHead) {
        this.options = options;
        this.index = index;
        this.header = head;
        this.cells = [];

        if (this.header.body) {
            this.cells = this.header.body.rows.map(row => {
                return row.cells[index];
            });
        }
    }
}