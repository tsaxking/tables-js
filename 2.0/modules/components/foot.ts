class TableFoot extends TableElement {
    table:Table_v2;
    constructor(table:Table_v2) {
        const el = document.createElement('tfoot');
        super(el);
        this.table = table;
    }
}