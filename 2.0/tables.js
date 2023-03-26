class Table {
    /**
     * 
     * @param {HTMLTableElement} table 
     */
    constructor(table) {
        if (!table || !(table instanceof HTMLTableElement)) {
            throw new Error('Invalid table element');
        }
        if (table.querySelector('thead') || table.querySelector('tbody') || table.querySelector('tfoot')) {
            throw new Error('Table is already populated');
        }

        this.thead = document.createElement('thead');
        this.thead.appendChild(document.createElement('tr'));
        this.tbody = document.createElement('tbody');

        table.appendChild(this.thead);
        table.appendChild(this.tbody);

        /**
         * @type {HTMLTableElement}
         */
        this.el = table;

        this.headers = [];
        this.rows = [];
        this.columns = [];
    }

    addHeaders(...headers) {
        headers.forEach(header => this.addHeader(header));
    }

    addHeader(header, options = {}) {
        if (typeof header == 'undefined') {
            throw new Error('Invalid header');
        }

        const th = document.createElement('th');
        if (header.querySelector) th.appendChild(header);
        else th.textContent = header;
        this.thead.querySelector('tr').appendChild(th);

        return th;
    }

    addRow() {}
}