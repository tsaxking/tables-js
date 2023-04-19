class TableRow extends TableElement {
    table:Table_v2;
    cells:TableCell[];

    constructor(table:Table_v2) {
        const el = document.createElement('tr');
        super(el);
        this.table = table;

        this.cells = [];
    }

    addCell(content:string|HTMLElement|TableCell|number) {
        if (content instanceof TableCell) {
            this.cells.push(content);
            this.el.appendChild(content.el);
            return content;
        }

        const newCell = new TableCell(content, this.table);
        this.cells.push(newCell);
        this.el.appendChild(newCell.el);

        return newCell;
    }

    addCells(...contents:(string|HTMLElement|number|TableCell)[]) {
        contents.forEach(content => {
            this.addCell(content);
        });
    }
}