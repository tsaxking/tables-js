class TableElement {
    constructor() {
        this.el = null;

        this.listeners = [];

        this.events = {};
    }

    on(event, callback, options) {}

    off(event, callback, options) {}
}

class Table {
    /**
     * 
     * @param {HTMLTableElement} table The table element to use 
     */
    constructor(table, options = {}) {
        if (typeof table == 'string') table = document.querySelector(table);

        if (!(table instanceof HTMLTableElement)) throw new Error('Table must be an HTMLTableElement or a selector for a valid one');

        /**
         * @type {HTMLTableElement}
         */
        this.el = table;

        /**
         * @type {Table.RowCollection}
         */
        this.rows = new Table.RowCollection(this);
        /**
         * @type {Table.CellCollection}
         */
        this.columns = new Table.ColumnCollection(this);
        /**
         * @type {Table.HeaderCollection}
         */
        this.headers = new Table.HeaderCollection(this);
    }

    clear() {
        this.headers.clear();
        this.rows.clear();
        this.el.innerHTML = '';
    }
};
Table.Row = class Row {
    constructor(table) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {Table.CellCollection}
         */
        this.cells = new Table.CellCollection(this.table);

        /**
         * @type {HTMLTableRowElement}
         */
        this.el = document.createElement('tr');
    }

    clear() {
        this.cells.clear();
        this.el.innerHTML = '';
    }
};
Table.Cell = class Cell {
    constructor(table, content, type) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {string}
         */
        this.content = content;

        /**
         * @type {HTMLTableCellElement}
         */
        this.el = document.createElement(type == 'header' ? 'th' : 'td');
    }

    clear() {
        this.el.innerHTML = '';
        this.content = '';
    }
};
Table.Column = class Column {
    constructor(table) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {Table.CellCollection}
         */
        this.cells = new Table.CellCollection(this.table);
    }

    clear() {
        this.cells.clear();
    }
};
Table.Header = class Header {
    constructor(table, content) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {string}
         */
        this.content = content;

        this.cell = new Table.Cell(this.table, content, 'header');
    }

    clear() {
        this.cell.clear();
    }
};
Table.RowCollection = class RowCollection {
    constructor(table) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {Table.Row[]}
         */
        this.items = [];
    }

    clear() {
        this.items.forEach(row => row.clear());
    }

    /**
     * 
     * @param {Table.Row} row 
     */
    add(row, index) {
        if (!(row instanceof Table.Row)) throw new Error('Row must be an instance of Table.Row');

        if (index == undefined) {
            this.items.push(row);
            this.table.tbody.appendChild(row.el);
        } else {
            this.items.splice(index, 0, row);
            this.table.tbody.insertBefore(row.el, this.table.tbody.children[index]);
        }

        this.table.columns.items.forEach((column, i) => column.cells.add(row.cells.items[i]));
    }
};
Table.CellCollection = class CellCollection {
    constructor(table) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {Table.Cell[]}
         */
        this.items = [];
    }

    clear() {
        this.items.forEach(cell => cell.clear());
    }

    /**
     * 
     * @param {Table.Cell} cell 
     */
    add(cell) {
        if (!(cell instanceof Table.Cell)) throw new Error('Cell must be an instance of Table.Cell');

        this.items.push(cell);
        this.table.rows.items[this.table.rows.items.length - 1].el.appendChild(cell.el);
    }
};
Table.ColumnCollection = class ColumnCollection {
    constructor(table) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {Table.Column[]}
         */
        this.items = [];
    }
};
Table.HeaderCollection = class HeaderCollection {
    constructor(table) {
        /**
         * @type {Table}
         */
        this.table = table;

        /**
         * @type {Table.Header[]}
         */
        this.items = [];
    }

    clear() {
        this.items.forEach(header => header.clear());
    }
};