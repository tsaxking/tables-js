class TableHeaderCell extends TableCell {
    constructor(content:string|HTMLElement, table:Table_v2) {
        super(content, table);
        this.el = document.createElement('th');
    }
}