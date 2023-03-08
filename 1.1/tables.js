/**
 * Parses a string (csv, tsv, etc.) into an object
 * @param {String} str String to parse into object 
 * @param {String} delimeter Delimeter to split the rows by
 * @param {String} escape Escape character to escape delimeters 
 * @returns {Object[]} Array of objects
 */
const parseSV = (str, delimeter, escape) => {
    // return [{a: 1, b: 2}, {a: 3, b: 4}]
    // include " in the string to escape it

    // headers is first row, it could have " in it to escape commas
    // data is the rest of the rows

    // split the string into rows
    const data = str.split('\n');

    // get the headers
    const headers = data[0].split(delimeter).map((h) => {
        if (h[0] === escape && h[h.length - 1] === escape) {
            return h.substring(1, h.length - 1);
        } else {
            return h;
        }
    });

    data.shift();

    // get the data
    return data.map((row) => {
        const splitRow = row.split(delimeter).map(r => {
            if (r[0] === escape && r[r.length - 1] === escape) {
                return r.substring(1, r.length - 1);
            } else {
                return r;
            }
        });

        // console.log(splitRow);

        return splitRow.reduce((acc, curr, i) => {
            acc[headers[i]] = curr.trim();
            return acc;
        }, {});
    });
}

const parseHTML = (str) => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.firstChild;
}

class RenderedTable {
    /**
     * 
     * @param {HTMLTableElement} table table to render 
     * @param {Boolean} render whether to render the table or not
     */
    constructor(table, render = true) {
        if (!(table instanceof HTMLTableElement)) {
            throw new Error('Invalid table element');
        }

        this.table = table;

        this.rows = [];

        if (render) this.render();
    }

    render() {
        this.rows = Array.from(this.table.querySelectorAll('tbody tr')).map((row, i) => {
            return new RenderedTableRow(row, i);
        });

        this.rows.forEach(r => r.render());
    }

    sort(columnIndex, ascending = true) {
        this.rows.sort((a, b) => {
            const aCell = a.cells[columnIndex];
            const bCell = b.cells[columnIndex];

            if (aCell === undefined || bCell === undefined) {
                throw new Error('Invalid column index');
            }

            const aContent = aCell.cell.textContent;
            const bContent = bCell.cell.textContent;

            if (aContent > bContent) {
                return ascending ? 1 : -1;
            } else if (aContent < bContent) {
                return ascending ? -1 : 1;
            } else {
                return 0;
            }
        });

        this.table.querySelector('tbody').innerHTML = '';

        this.rows.forEach((r, i) => {
            this.table.querySelector('tbody').appendChild(r.row);
        });
    }

    invert() {
        // console.log('inverting...');
        // switch x and y axis
        const rows = new Array(this.rows[0].cells.length).fill(null).map(() => []);

        const ths = Array.from(this.table.querySelectorAll('thead th')).map((th, i) => {
            if (th.children.length) {
                return th.children[0];
            } else return th.innerHTML;
        });

        this.rows.forEach((row, i) => {
            row.cells.forEach((cell, j) => {
                if (i === 0) {
                    const th = document.createElement('th');
                    if (typeof ths[j] === 'string') {
                        th.innerHTML = ths[j];
                    } else {
                        th.appendChild(ths[j]);
                    }
                    rows[j].push(th);
                }

                const td = document.createElement('td');
                td.innerHTML = cell.cell.innerHTML;
                rows[j].push(td);
            });
        });

        this.table.querySelector('thead').innerHTML = '';
        this.table.querySelector('tbody').innerHTML = '';

        rows.forEach((row, i) => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                tr.appendChild(cell);
            });
            if (i === 0) {
                this.table.querySelector('thead').appendChild(tr);
            } else {
                this.table.querySelector('tbody').appendChild(tr);
            }
        });

        this.render();
    }
}

class RenderedTableRow {
    /**
     * 
     * @param {HTMLTableRowElement} row row to render
     * @param {Number} index index of the row
     */
    constructor(row, index) {
        if (!(row instanceof HTMLTableRowElement)) {
            throw new Error('Invalid row element');
        }

        this.row = row;
        this.index = index;

        this.cells = [];
    }

    render() {
        this.cells = Array.from(this.row.cells).map((cell, i) => {
            return new RenderedTableCell(cell, i);
        });
    }
}

class RenderedTableCell {
    /**
     * 
     * @param {HTMLTableCellElement} cell cell to render
     * @param {Number} index index of the cell
     */
    constructor(cell, index) {
        if (!(cell instanceof HTMLTableCellElement)) {
            throw new Error('Invalid cell element');
        }

        this.cell = cell;
        this.index = index;
    }
}

class Table_Calculator {
    constructor(index) {
        this.el = parseHTML(`<input class="form-control" type="text">`);
        this.headerIndex = index;

        this.listeners = [];
    }

    /**
     * 
     * @param  {...TableCell} cells Table Cells to run the calculator on
     */
    run(...cells) {
        let { value } = this.el;
        // input is a string
        // {1} + 2 / ({4} * 8)
        // cells[0].content + 2 / (cells[3].content * 8)

        const regex = /{(\d+)}/g;
        let match;
        while (match = regex.exec(value)) {
            const index = +match[1];
            if (this.headerIndex == index) {
                throw new Error('Cannot reference self');
            }
            const cell = cells[index];
            if (!cell) {
                throw new Error('Invalid cell index: ' + index);
            }
            value = value.replace(match[0], cell.content);
        }

        try {
            return Table_Calculator.evaluate(value);
        } catch {
            return 'Invalid Input';
        }
    }

    /**
     * 
     * @param {String} str string to evaluate
     * @returns 
     */
    static evaluate = (str) => {
        str = str.replace(/\s/g, '');
        const evaluate = (str) => {
            if (str.includes('(')) {
                str = getParentheses(str);
            };
            const operators = ['^', '*', '/', '+', '-'];

            return operators.reduce((acc, operator) => {
                const run = (str) => {
                    const index = str.lastIndexOf(operator);
                    if (index === -1) {
                        return str;
                    }

                    const replace = (str, index, operator) => {
                        const leftIndex = (() => {
                            let i = index - 1;
                            // get the left full number (including decimals)
                            while (i >= 0 && !isNaN(+str[i]) || str[i] === '.') {
                                i--;
                            }
                            return i + 1;
                        })();

                        const rightIndex = (() => {
                            let i = index + 1;
                            // get the right full number (including decimals)
                            while (i < str.length && !isNaN(+str[i]) || str[i] === '.') {
                                i++;
                            }
                            return i;
                        })();


                        const left = +str.substring(leftIndex, index);
                        const right = +str.substring(index + 1, rightIndex);

                        const test = (input) => {
                            return true;
                        }

                        if (!test(left) || !test(right)) {
                            throw new Error('Invalid input', left, right, str);
                        }

                        // console.log(left, operator, right);

                        const result = (() => {
                            switch (operator) {
                                case '^':
                                    return Math.pow(left, right);
                                case '*':
                                    return left * right;
                                case '/':
                                    return left / right;
                                case '+':
                                    return +left + +right;
                                case '-':
                                    return left - right;
                            }
                        })();

                        return str.substring(0, leftIndex) + result + str.substring(rightIndex);
                    }

                    str = replace(str, index, operator);
                    if (str.includes(operator)) {
                        return run(str);
                    }
                    return str;
                }
                return run(acc);
            }, str);
        }

        const getParentheses = (str) => {
            // get innermost parentheses
            const start = str.lastIndexOf('(');
            const end = str.indexOf(')', start);
            const inner = str.substring(start + 1, end);

            // evaluate innermost parentheses
            const result = evaluate(inner);

            // replace innermost parentheses with result
            str = str.substring(0, start) + result + str.substring(end + 1);

            // if there are still parentheses, evaluate again
            if (str.includes('(')) {
                return getParentheses(str);
            }

            return str;
        };

        const result = evaluate(str);
        if (isNaN(result)) {
            throw new Error('Invalid input: evaluated to: ' + result);
        }
        return +result;
    }

    setCells(rows, cb = () => {}) {
        const listener = (e) => {
            if (e.key === 'Enter') {
                rows.forEach(row => {
                    row.cells[this.headerIndex].el.innerHTML = this.run(...row.cells);
                });
                cb();
            }
        }

        this.el.addEventListener('keypress', listener);

        return () => {
            this.el.removeEventListener('keypress', listener);
        }
    }

    on(event, cb) {}

    off(event, cb) {}
}


/**
 *  A class that handles the state of a table
 */
class Table_StateStack {
    constructor() {
        this.states = [];
        this.currentState = null;
        this.currentIndex = -1;
        this.locked = false;

        this.currentUnsavedState = null;
        this.currentUnsavedIndex = -1;

        this.unsavedStates = [];
    }

    /**
     * 
     * @param {Any} state Anything
     * @returns Copied state with no dependencies
     */
    copyState(state) {
        if (Array.isArray(state)) {
            return [...state];
        }

        switch (typeof state) {
            case 'object':
                return {...state };
            default:
                return JSON.parse(JSON.stringify(state));
        }
    }

    /**
     * 
     * @param {Any} state This can be anything, it will be passed to onChange()
     */
    addState(state) {
        if (this.currentIndex < this.states.length - 1) {
            // remove all states after currentIndex
            this.states = this.states.splice(0, this.currentIndex + 1);

            this.states.push(this.copyState(state));
            this.currentIndex = this.states.length - 1;
            this.currentState = this.states[this.currentIndex];
        } else {
            this.states.push(this.copyState(state));
            this.currentIndex = this.states.length - 1;
            this.currentState = this.states[this.currentIndex];
        }

        this.resolve();
    }

    /**
     * 
     * @param {Any} state This can be anything, it will be passed to onChange() 
     */
    addUnsavedState(state) {
        if (this.currentUnsavedIndex < this.unsavedStates.length - 1) {
            // remove all states after currentIndex
            this.unsavedStates = this.unsavedStates.splice(0, this.currentUnsavedIndex + 1);

            this.unsavedStates.push(this.copyState(state));
            this.currentUnsavedIndex = this.unsavedStates.length - 1;
            this.currentUnsavedState = this.unsavedStates[this.currentUnsavedIndex];
        } else {
            this.unsavedStates.push(this.copyState(state));
            this.currentUnsavedIndex = this.unsavedStates.length - 1;
            this.currentUnsavedState = this.unsavedStates[this.currentUnsavedIndex];
        }

        this.unsavedStates = this.unsavedStates.filter((s, i) => this.unsavedStates.indexOf(s) === i);

        this.resolveUnsaved();
    }

    /**
     *  This is called when the stack is cleared
     */
    nextUnsaved() {
        if (this.unsavedStates.length > 0 && this.currentUnsavedIndex < this.unsavedStates.length - 1) {
            this.currentUnsavedState = this.unsavedStates[this.currentUnsavedIndex + 1];
            this.currentUnsavedIndex++;

            this.resolveUnsaved();
        } else {
            return null;
        }
    }

    /**
     *  This is called when the stack is cleared
     */
    prevUnsaved() {
        if (this.unsavedStates.length > 0 && this.currentUnsavedIndex > 0) {
            this.currentUnsavedState = this.unsavedStates[this.currentUnsavedIndex - 1];
            this.currentUnsavedIndex--;

            this.resolveUnsaved();
        } else {
            return null;
        }
    }

    /**
     *   Destroys the stack and calls onClear()
     */
    clearStates() {
        this.states = [];
        this.currentIndex = -1;
        this.onClear();
        this.currentState = null;
        this.unsavedStates = [];
    }

    /**
     *  Goes to the next state in the stack
     */
    next() {
        if (this.states.length > 0 && this.currentIndex < this.states.length - 1) {
            this.currentState = this.states[this.currentIndex + 1];
            this.currentIndex++;

            this.resolve();
        } else {
            this.onReject(this.currentState);
        }
    }

    /**
     *  Goes to the previous state in the stack
     */
    prev() {
        if (this.states.length > 0 && this.currentIndex > 0) {
            this.currentState = this.states[this.currentIndex - 1];
            this.currentIndex--;
            // this.findBranch(this.currentIndex);
            this.resolve();
        } else {
            this.onReject(this.currentState);
        }
    }

    /**
     *  Gets the number of states in the current stack
     */
    get numStacks() {
        return this.states.length;
    }

    /**
     *  Resolves the current state
     */
    resolve() {
        if (this.locked) {
            this.onReject(this.currentState);
        } else {
            this.onChange(this.currentState);
        }
    }

    resolveUnsaved() {
        if (this.locked) {
            this.onRejectUnsaved(this.currentUnsavedState);
        } else {
            this.onChangeUnsaved(this.currentUnsavedState);
        }
    }

    /**
     *   Customizable callback for when the state changes
     */
    onChange() {}

    /**
     *  Customizable callback for when the state changes
     */
    onChangeUnsaved() {}

    /**
     *   Customizable callback for when the state changes to a rejected state
     */
    onReject() {
        throw new Error('State does not exist, nothing has changed');
    }

    /**
     *  Customizable callback for when the state changes to a rejected state
     */
    onRejectUnsaved() {
        throw new Error('State does not exist, nothing has changed');
    }

    /**
     *  Customizable callback for when the stack is cleared
     */
    onClear() {}

    /**
     *  Customizable callback for when the stack is locked
     */
    get hasNext() {
        return this.currentIndex < this.states.length - 1;
    }

    /**
     *  Customizable callback for when the stack is locked
     */
    get hasPrev() {
        return this.currentIndex > 0;
    }

    /**
     *  Customizable callback for when the stack is locked
     */
    get hasUnsavedNext() {
        return this.currentUnsavedIndex < this.unsavedStates.length - 1;
    }

    /**
     *  Customizable callback for when the stack is locked
     */
    get hasUnsavedPrev() {
        return this.currentUnsavedIndex > 0;
    }
}

/**
 *  A class for creating a table
 * @public
 * @class
 * @classdesc A class for creating a table
 * 
 * @since 1.1.0
 * 
 * @example
 * const table = new Table('table', [], [], {});
 */
class Table {
    /**
     * @param {HTMLElement | String} table The table element or css selector for the table
     * 
     * 
     * 
     * @param {Object[]} headers The headers for the table
     * 
     * @param {Object} headers[].calculator Whether or not this column is a calculator column (td elements are input:text elements)
     * 
     * @param {String} headers[].title The title of the header
     * @param {String} headers[].name The name of the header (used the same as title)
     * @param {String} headers[].key The key of the header (used the same as name)
     * @param {Boolean} headers[].frozen Whether or not the column is frozen (prevents it from scrolling horizontally)
     * 
     * @param {Function} headers[].getData A function that returns the data for the td element (takes in the row data)
     * @param {Function} headers[].sort A function that returns the data for the column (takes in (TableRow, TableRow))
     * @param {Boolean} headers[].minimize Whether or not to add minimize functionality to the header
     * @param {Object} headers.th An object with properties for the th element
     * @param {String[]} headers[].th.classes An array of classes to add to the td elements
     * 
     * @param {Object} headers[].td An object with properties for the td elements
     * @param {String[]} headers[].td.lasses An array of classes to add to the th elements
     * @param {Object[]} headers[].td.classTests An array of objects with class tests for the td elements
     * @param {String} headers[].td.classTests[].class The class to add to the td element
     * @param {String[]} headers[].td.classTests[].classes The class to add to the td element
     * @param {Function} headers[].td.classTests[].test A function that returns a boolean for whether or not to add the class to the td element (takes in the row data)
     * @todo Divide td and th into separate objects within the headers array
     * 
     * @param {Object[]} headers[].th.listeners An array of objects with event listeners for the th elements
     * @param {String} headers[].th.listeners[].listener The event listener type
     * @param {Function} headers[].th.listeners[].callback The callback function for the event listener (uses 1.1.0+ data structure)
     * @param {Function} headers[].th.listeners[].action The action function for the event listener (takes in the 1.0.0 data structure)
     * 
     * @param {Object[]} headers[].td.listeners An array of objects with event listeners for the td elements
     * @param {String} headers[].td.listeners[].listener The event listener type
     * @param {Function} headers[].td.listeners[].callback The callback function for the event listener (uses 1.1.0+ data structure)
     * @param {Function} headers[].td.listeners[].action The action function for the event listener (takes in the 1.0.0 data structure)
     * 
     * @param {Any[]} data The data for the table
     * 
     * 
     * 
     * @param {Object} options The options for the table
     * 
     * 
     * @param {Function} options.appendTest A function that returns a boolean for whether or not to append a row, takes in the row data
     *
     * @param {Object} options.tr The options for the tr elements
     * @param {Object[]} options.tr.isteners An array of objects with event listeners for the table rows
     * @param {String} options.tr.listeners[].listener The event listener type
     * @param {Function} options.tr.listeners[].callback The callback function for the event listener (uses 1.1.0+ data structure)
     * @param {Function} options.tr.listeners[].action The action function for the event listener (takes in the 1.0.0 data structure)
     * 
     * @param {Object[]} options.tr.attributes An array of objects with attributes for the table rows
     * @param {String} options.tr.attributes[].attribute The attribute name
     * @param {String | Function} options.tr.attributes[].value The attribute value or a function that returns the attribute value (takes in the row data)
     * 
     * 
     * @param {String[]} options.trClasses An array of classes to add to the table rows
     * 
     * 
     * @param {Object[]} options.colGroup An array of objects with colGroup for the table
     * @param {String} options.colGroup[].span The span of the colGroup
     * @param {String} options.colGroup[].classes The classes of the colGroup
     * 
     * 
     * @param {Object[]} options.tr.classTests An array of objects with tests for the table rows
     * @param {String} options.tr.classTests[].class The class to add to the row
     * @param {String[]} options.tr.classTests[].classes The classes to add to the row
     * @param {Function} options.tr.classTests[].test A function that returns a boolean for whether or not to add the class to the row (takes in the row data)
     * 
     * 
     * @param {Boolean} options.fixedHeaders Whether or not to use style.position = 'sticky' for the headers
     * @param {String[]} options.classes An array of classes to add to the table element
     * 
     * 
     * @param {Object} options.dataTable Options for the DataTables library (use with JQuery and DataTables) Or just set it to true to use the default options
     * @param {Object} options.datatable Options for the DataTables library (use with JQuery and DataTables) Or just set it to true to use the default options
     * 
     * 
     * @param {Object} options.reorder Under Construction: Options for the drag/drop reorder functionality
     * 
     * @param {Object} options.reorder.listeners An object with event listeners for each drag event
     * @param {Function} options.reorder.listeners.onDragStart The event listener for when a row is dragged (uses event)
     * @param {Function} options.reorder.listeners.onDrag The event listener for when a row is dragged over (uses event)
     * @param {Function} options.reorder.listeners.onDragEnd The event listener for when a row is dropped (uses event)
     * @param {Function} options.reorder.listeners.onDrop The event listener for when a row is dropped (uses event)
     * @param {Function} options.reorder.listeners.onDragEnter The event listener for when a row is dragged over (uses event)
     * @param {Function} options.reorder.listeners.onDragLeave The event listener for when a row is dragged over (uses event)
     * 
     * @param {Object} options.reorder.classes An object with classes for each drag event
     * @param {String[]} options.reorder.classes.dragging The class for when a row is being dragged
     * @param {String[]} options.reorder.classes.dragover The class for when a row is being dragged over
     * @param {String[]} options.reorder.classes.dragenter The class for when a row is being dragged over
     * @param {String[]} options.reorder.classes.dragleave The class for when a row is being dragged over
     * @param {String[]} options.reorder.classes.dragstart The class for when a row is being dragged
     * @param {String[]} options.reorder.classes.dragend The class for when a row is being dragged
     * @param {String[]} options.reorder.classes.drop The class for when a row is being dropped
     * 
     * @param {HTMLElement | String} options.reorder.handle The element that is used to drag the row
     * 
     * 
     * @param {Object} options.sort Options for the sorting functionality (each header must containt a sort property)
     * @param {String[]} options.sort.classes The classes for the sorting buttons
     * 
     * 
     * @param {Object} options.editable Options for the editable functionality, applies contenteditable="true" to all td elements. Each getData() in the header must return a string
     * @param {Function} options.onChange The function to call when the data changes
     * @param {Function} options.onCancel The function to call when the data changes
     * 
     * @param {Boolean} options.invert Inverts the table, first column is the headers, first row is the data
     * 
     * 
     * // TODO: do all of these below here
     * @param {Object} options.search Under Construction: Options for the search functionality
     * @param {String} options.search.placeholder The placeholder for the search input
     * @param {String[]} options.search.classes The classes for the search input
     * 
     * 
     * @param {Object} options.pagination Under Construction: Options for the pagination functionality
     * @param {Number} options.pagination.perPage The number of rows to show per page
     * @param {String[]} options.pagination.classes The classes for the search input
     * @param {Object} options.pagination.icons The icons for the pagination buttons
     * @param {String} options.pagination.icons.first The icon for the first page button
     * @param {String} options.pagination.icons.prev The icon for the previous page button
     * @param {String} options.pagination.icons.next The icon for the next page button
     * @param {String} options.pagination.icons.last The icon for the last page button
     * 
     * 
     * @param {String | HTMLElement} options.caption Under Construction: The caption for the table
     * 
     * 
     * @param {Object} options.insert Under Construction: Options for the insert functionality
     * 
     * @param {Object} options.insert.row Options for inserting rows
     * @param {Object} options.insert.row.classes The classes for the insert row button
     * @param {String | HTMLElement} options.insert.row.icon The icon for the insert row button
     * @param {Function} options.insert.row.onClick The function to call when the insert row button is clicked
     * 
     * @param {Object} options.insert.column Options for inserting columns
     * @param {Object} options.insert.column.classes The classes for the insert column button
     * @param {String | HTMLElement} options.insert.column.icon The icon for the insert column button
     * @param {Function} options.insert.column.onClick The function to call when the insert column button is clicked
     * 
     * 
     * @param {Object} options.delete Under Construction: Options for the delete functionality
     * 
     * @param {Object} options.delete.row Options for deleting rows
     * @param {Object} options.delete.row.classes The classes for the delete row button
     * @param {String | HTMLElement} options.delete.row.icon The icon for the delete row button
     * @param {Function} options.delete.row.onClick The function to call when the delete row button is clicked
     * 
     * @param {Object} options.delete.column Options for deleting columns
     * @param {Object} options.delete.column.classes The classes for the delete column button
     * @param {String | HTMLElement} options.delete.column.icon The icon for the delete column button
     * @param {Function} options.delete.column.onClick The function to call when the delete column button is clicked
     */
    constructor(table, headers, data, options) {
        if (typeof table === 'string') table = document.querySelector(table);

        if (!table instanceof HTMLTableElement) {
            throw new Error('Table must be an HTML Table Element');
        }

        if (!headers) {
            throw new Error('Headers must be provided');
        }

        if (!data) {
            throw new Error('Data must be provided');
        }

        /**
         *  Whether the table has been rendered
         * @type {Boolean}
         * @private
         */
        this.rendered = false;

        /**
         *  The table element
         * @type {HTMLElement}
         * @public
         */
        this.el = table;

        /**
         *  The rows in the table
         * @type {Array<TableRow>}
         * @public
         */
        this.rows = [];

        /**
         *  The columns in the table
         * @type {Array<TableColumn>}
         * @public
         */
        this.columns = new Array(headers.length).fill();

        /**
         *  The headers in the table (passed in the constructor)
         * @type {Array<Object>}
         * @public
         */
        this.headers = Array.isArray(headers) ? headers.map(h => {
            return typeof headers == 'string' ? { title: h } : h;
        }) : (typeof headers === 'object' ? Object.keys(headers).map(h => {
            return {
                title: h,
                ...headers[h]
            }
        }) : [])

        /**
         *  The options for the table (passed in the constructor)
         * @type {Object}
         * @public
         */
        this.options = options || {};

        /**
         *  The original data in the table (passed in the constructor)
         * @type {Array<Any>}
         * @public
         */
        this.originalData = [...data];

        /**
         *  The data in the table (passed in the constructor)
         * @type {Array<Any>}
         * @public
         */
        this.data = data;

        /**
         *  The rows for insert on a reordering table
         * @type {Array<ReorderInsertRow>}
         * @public
         */
        this.insertRows = [];

        /**
         *  The shown rows for insert on a reordering table
         * @type {Array<ReorderInsertRow>}
         * @public
         */
        this.shownInsertRows = [];

        /**
         *  The sections of the table (thead, tbody, tfoot, etc.)
         * @type {Object}
         * @public
         */
        this.sections = {}

        /**
         *  The state stack for the table
         * @type {Table_StateStack}
         * @public
         */
        this.stack = new Table_StateStack();
        this.stack.onChange = () => {
            this.renderFromContent();
        }

        this.stack.onClear = () => {
            this.destroy(true);
        }

        this.stack.onReject = () => {};

        if (this.options.__render !== false) this.stack.addState(this);

        /**
         * The listeners for the table
         * @type {Array<event: String, callback: Function, options: Object>}
         */
        this.listeners = [];
    }

    /**
     *  Erases all elements in the table
     * @param {Boolean} removeData Whether or not to remove the data from the table class
     * @memberof Table
     * @returns {void}
     * @example
     * table.destroy();
     */
    destroy(removeData = false) {
        this.el.innerHTML = '';

        if (removeData) {
            this.data = [];
            this.rows = [];
            this.headers = [];
            this.columns = [];
            this.insertRows = [];
        }
    }

    /**
     *  Renders the table
     * @memberof Table
     * @returns {void}
     * @example
     * table.render();
     */
    render() {
        const {
            evenColumns,
            reorder,
            caption
        } = this.options;
        this.destroy();

        // add classes to the table
        if (Array.isArray(this.options.classes)) {
            this.el.classList.add(...this.options.classes);
        }

        if (reorder) {
            // reorder logic
            if (!this.options.trAttributes) this.options.trAttributes = [];

            let {
                listeners,
                handle,
                tdClassChanges
            } = this.options.reorder;

            if (!listeners) listeners = {};
            if (!tdClassChanges) tdClassChanges = {};

            // returns {x,y} from event regardless of whether it is a touch event or not
            const getXY = (e) => {
                if (e.touches) {
                    return {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    };
                }
                return {
                    x: e.clientX,
                    y: e.clientY
                };
            };

            let isDragging = false;
            // utilizes v1.0 event listener type
            const dragStart = ({ event }) => {
                event.preventDefault();
                isDragging = true;
                const tempTr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = this.headers.length;
                td.style.height = '100%';
                td.classList.add(...(tdClassChanges.tempTr ? tdClassChanges.tempTr : []));
                tempTr.appendChild(td);

                tempTr.id = 'temp-tr';

                const tr = event.target.closest('tr');
                tempTr.style.height = `${tr.offsetHeight}px`;
                tr.style.transition = '';
                tr.insertAdjacentElement('afterend', tempTr);
                tr.querySelectorAll('td').forEach(td => {
                    td.classList.add(...(tdClassChanges.dragging ? tdClassChanges.dragging : []));
                    td.style.zIndex = '99999';
                });

                tr.style.cursor = 'grabbing !important';
                tr.style.userSelect = 'none';
                tr.style.position = 'fixed';

                const { x, y } = getXY(event);
                tr.dataset.x = x;
                tr.dataset.y = y;
            };

            let lastTr;

            const dragging = ({ event }) => {
                if (!isDragging) return;
                // console.log('dragging');
                event.preventDefault();
                const tr = event.target.closest('tr');
                if (tr.style.position !== 'fixed') return;

                const { x, y } = getXY(event);
                const dx = x - tr.dataset.x;
                const dy = y - tr.dataset.y;

                tr.style.transform = `translate(${dx}px, ${dy}px)`;

                // return;
                const foundTr = this.rows.find(r => {
                    if (r.el == tr) return;

                    const rRect = r.el.getBoundingClientRect();
                    const trRect = tr.getBoundingClientRect();

                    return trRect.y + trRect.height / 2 > rRect.y && trRect.y + trRect.height / 2 < rRect.y + rRect.height;
                });

                if (foundTr) {
                    if (foundTr != lastTr) {
                        this.hideInsertRows();

                        if (lastTr) {
                            lastTr.el.querySelectorAll('td').forEach(td => {
                                td.classList.remove(...(tdClassChanges.swap ? tdClassChanges.swap : []));
                            });
                        }

                        foundTr.el.querySelectorAll('td').forEach(td => {
                            td.classList.add(...(tdClassChanges.swap ? tdClassChanges.swap : []));
                        });
                        // return;
                        this.showInsertRows(foundTr);

                    }
                    lastTr = foundTr;

                    const { above, below } = foundTr.insertRows;

                    const trRect = tr.getBoundingClientRect();
                    const aboveRect = above.el.getBoundingClientRect();
                    const belowRect = below.el.getBoundingClientRect();

                    if (trRect.y + trRect.height / 2 > aboveRect.y + aboveRect.height / 2) {
                        above.el.classList.add(...(tdClassChanges.insert ? tdClassChanges.insert : []));
                        // allowDragEnd = false;
                    } else {
                        above.el.classList.remove(...(tdClassChanges.insert ? tdClassChanges.insert : []));
                        // allowDragEnd = true;
                    }

                    if (trRect.y + trRect.height / 2 < belowRect.y + belowRect.height / 2) {
                        below.el.classList.add(...(tdClassChanges.insert ? tdClassChanges.insert : []));
                        allowDragEnd = false;
                    } else {
                        below.el.classList.remove(...(tdClassChanges.insert ? tdClassChanges.insert : []));
                        // allowDragEnd = true;
                    }
                }
            };

            // let allowDragEnd = true;

            const dragEnd = (e) => {
                if (!isDragging) return;
                e.event.preventDefault();
                // console.log('Drag end');
                const tr = e.event.target.closest('tr');
                tr.style.cursor = '';
                tr.style.userSelect = '';
                tr.style.position = '';

                // animate back to original position
                tr.style.transition = 'transform 0.2s ease-in-out';
                tr.style.transform = '';

                const tempTr = this.el.querySelector('#temp-tr');
                if (tempTr) tempTr.remove();


                this.hideInsertRows();

                this.el.querySelectorAll('td').forEach(td => {
                    td.classList.remove(...(tdClassChanges.swap ? tdClassChanges.swap : []));
                    td.classList.remove(...(tdClassChanges.dragging ? tdClassChanges.dragging : []));
                    td.classList.remove(...(tdClassChanges.insert ? tdClassChanges.insert : []));
                    td.style.zIndex = '';
                });

                isDragging = false;
            };

            this.options.trAttributes.push({
                attribute: 'data-swap',
                value: 'false'
            }, {
                attribute: 'data-insert',
                value: 'false'
            });

            this.headers.unshift({
                __drag: true,
                title: 'Drag',
                getData: () => {
                    if (handle) return handle;

                    const i = document.createElement('i');
                    i.classList.add('material-icons');
                    i.innerText = 'drag_indicator';
                    return i;
                },
                td: {
                    listeners: [{
                        event: 'mousedown',
                        action: dragStart,
                        callback: listeners.onDragStart ? listeners.onDragStart : () => {}
                    }, {
                        event: 'touchstart',
                        action: dragStart,
                        callback: listeners.onDragStart ? listeners.onDragStart : () => {}
                    }, {
                        event: 'mousemove',
                        action: dragging,
                        callback: listeners.onDrag ? listeners.onDrag : () => {}
                    }, {
                        event: 'touchmove',
                        action: dragging,
                        callback: listeners.onDrag ? listeners.onDrag : () => {}
                    }, {
                        event: 'mouseup',
                        action: dragEnd,
                        callback: listeners.onDragEnd ? listeners.onDragEnd : () => {}
                    }, {
                        event: 'touchend',
                        action: dragEnd,
                        callback: listeners.onDragEnd ? listeners.onDragEnd : () => {}
                    }, {
                        event: 'mouseleave',
                        action: dragEnd,
                        callback: listeners.onDragEnd ? listeners.onDragEnd : () => {}
                    }, {
                        event: 'touchcancel',
                        action: dragEnd,
                        callback: listeners.onDragEnd ? listeners.onDragEnd : () => {}
                    }],
                    attributes: [{
                        attribute: 'style',
                        value: 'cursor: grab; user-select: none;'
                    }]
                }
            });

            this.headers = this.headers.filter((h, i) => this.headers.findIndex(h2 => h2.title === h.title) === i);

            // insert 2 full span rows between each row
            this.data = this.data.reduce((a, c, i) => {
                if (i === 0) return [{
                    __insertRow: true
                }, c, {
                    __insertRow: true
                }];
                return [...a, { // insert 2 for stripes
                        __insertRow: true
                    },
                    c,
                    {
                        __insertRow: true
                    }
                ];
            }, []);
        }

        this.renderHeaders();
        this.renderRows();

        if (caption) {

            if (typeof caption == 'object') {

                const {
                    content,
                    attributes,
                    listeners,
                    classes
                } = caption;

                const captionEl = document.createElement('caption');
                if (typeof content == string) captionEl.innerText = content;
                else captionEl.appendChild(content);

                if (attributes) attributes.forEach(attr => {
                    captionEl.setAttribute(attr.attribute, attr.value);
                });

                if (listeners) listeners.forEach(listener => {
                    captionEl.addEventListener(listener.event, listener.action);
                });

                if (classes) captionEl.classList.add(...classes);

                // append at top
                this.el.insertBefore(captionEl, this.el.firstChild);
            } else {
                const captionEl = document.createElement('caption');
                captionEl.innerText = caption;
                this.el.insertBefore(captionEl, this.el.firstChild);
            }
        }

        // makes all columns the same width
        if (evenColumns) {
            const width = this.el.offsetWidth;
            this.columns.forEach(col => {
                col.cells.forEach(cell => {
                    cell.el.style.width = `${width / this.columns.length}px`;
                });
            });
        }

        // JQuery DataTables
        if (this.options.dataTable || this.options.datatable) {
            $(this.el).DataTable(this.options.dataTable || this.options.datatable);
        }


        if (this.options.invert) {
            this.renderedTable.invert();
        }
    }

    /**
     * 
     * @param {TableRow} row Shows the insert rows above and below the given row
     * @returns {Array<TableRow>} The insert rows
     * @memberof Table
     * @private
     * @since 1.0.0
     * @version 1.0.0
     * @example
     * table.showInsertRows(table.rows[0]);
     */
    showInsertRows(row) {
        // console.log('Showing insert rows', row);
        row.insertRows.above.show();
        row.insertRows.below.show();

        row.insertRows.above.el.style.height = row.el.offsetHeight + 'px';
        row.insertRows.below.el.style.height = row.el.offsetHeight + 'px';

        this.shownInsertRows.push(row.insertRows.above, row.insertRows.below);

        return [row.insertRows.above, row.insertRows.below];
    }

    /**
     * Hides all the insert rows
     * @returns {void}
     * @memberof Table
     * @private
     * @since 1.0.0
     * @version 1.0.0
     * @example
     * table.hideInsertRows();
     */
    hideInsertRows() {
        let { reorder: { tdClassChanges } } = this.options;

        if (!tdClassChanges) tdClassChanges = {};

        this.shownInsertRows.forEach(r => {
            r.hide();
            r.el.classList.remove(...(tdClassChanges.insert ? tdClassChanges.insert : []));
        });
        this.shownInsertRows = [];
    }

    /**
     *  Renders the table headers (Automatically called by `Table.render`)
     * @returns {void}
     * @memberof Table
     * @private
     * @since 1.0.0
     * @version 1.0.0
     * @example
     * table.renderHeaders();
     */
    renderHeaders() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        const tfoot = document.createElement('tfoot');
        const tfootTr = document.createElement('tr');

        const {
            fixedHeaders,
            editable,
            minimize
        } = this.options;

        // test if duplicate h.title || h.key || h.name
        const hasDuplicates = this.headers.some((h, i) => this.headers.findIndex(h2 => h2.title === h.title) !== i);

        if (hasDuplicates && editable) {
            console.warn('Duplicate header titles found. This may cause unexpected behavior on `Table.content`.');
        }

        this.tableHeaders = new TableRow([]);

        this.columns = this.headers.map((h, i) => {
            if (!h) return;
            const th = new TableHeader(h.title);

            if (h.calculator) {
                const { calculator } = h;

                h.calculator = new Table_Calculator(i);
                const th = new TableHeader(h.calculator.el);
                th.calculator = h.calculator;
                if (typeof calculator == 'object') {

                }
                this.tableHeaders.cells.push(th);
                tr.appendChild(th.el);
                return new TableColumn([th], h);
            }

            const {
                minimize,
                sort,
                th: _thInfo,
                frozen
            } = h;

            if (frozen) {
                if (i !== 0) console.warn('Frozen columns must be the first column in the table. Ignoring frozen column.');
                // freeze the column
                th.el.style.position = 'sticky';
                th.el.style.left = '0';
                th.el.style.zIndex = '1';
            }

            let thClasses,
                thAttributes;

            if (_thInfo) {
                thClasses = _thInfo.classes;
                thAttributes = _thInfo.attributes;
            }

            if (minimize) {
                const i = document.createElement('i');
                i.classList.add('material-icons');
                if (h.__minimized) {
                    i.innerText = 'chevron_right';
                    th.el.innerHTML = '';
                    th.el.appendChild(i);
                } else {
                    i.innerText = 'chevron_left';

                    const newTh = document.createElement('th');
                    const div = document.createElement('div');
                    div.classList.add('d-flex', 'align-items-center', 'justify-content-between');

                    const headerWrap = document.createElement('div');
                    if (typeof th.content == 'string') headerWrap.innerText = th.content;
                    else headerWrap.appendChild(th.content);

                    div.appendChild(headerWrap);
                    div.appendChild(i);
                    newTh.appendChild(div);

                    th.el = newTh;
                }

                i.style.cursor = 'pointer';

                i.addEventListener('click', () => {
                    if (h.__minimized) {
                        // i.innerText = 'chevron_left';
                        h.__minimized = false;
                        h.__reverse = 0;
                    } else {
                        // i.innerText = 'chevron_right';
                        h.__minimized = true;
                    }

                    this.render();
                });

                th.el.style.whiteSpace = 'nowrap';
            }

            if (sort) {
                th.el.style.cursor = 'pointer';
                th.el.addEventListener('click', () => {
                    let { __reverse } = h;
                    h.__sorted = true;

                    if (typeof __reverse === 'undefined') __reverse = true;
                    else if (+__reverse === 1) __reverse = false;
                    else if (+__reverse === 0) {
                        __reverse = undefined;
                        h.__sorted = false;
                    }

                    h.__reverse = __reverse;

                    this.data = this.sort(h.sort, __reverse, i);
                    this.render();
                });
            }

            if (Array.isArray(thClasses)) th.el.classList.add(...thClasses);

            if (Array.isArray(thAttributes)) {
                thAttributes.forEach(attr => {
                    th.el.setAttribute(attr.attribute, attr.value);
                });
            }

            tr.appendChild(th.el);
            tfootTr.appendChild(th.el.cloneNode(true));
            this.tableHeaders.cells.push(th);
            return new TableColumn([th], h);
        }).filter(h => h);

        if (fixedHeaders) {
            tr.style.position = 'sticky';
            tr.style.top = 0;
            tr.style.zIndex = 1;
        }

        thead.appendChild(tr);
        this.el.appendChild(thead);
        if (this.options.footer) {
            tfoot.appendChild(tfootTr);
            this.el.appendChild(tfoot);
        }
    }

    /**'
     *  Renders the table rows (Automatically called by `Table.render`)
     * @returns {void}
     * @memberof Table
     * @private
     * @since 1.0.0
     * @version 1.0.0
     * @example
     * table.renderRows();
     */
    renderRows() {
        const tbody = document.createElement('tbody');

        const {
            tr: trInfo,
            appendTest,
            colGroup,
            editable
        } = this.options;

        let tdTooltip = false;

        let attributes,
            classes,
            classTests,
            listeners;

        if (trInfo) {
            attributes = trInfo.attributes;

            if (attributes && !Array.isArray(attributes)) {
                attributes = Object.entries(attributes).map(([attribute, value]) => {
                    return {
                        attribute,
                        value
                    }
                });
            }

            classes = trInfo.classes;
            classTests = trInfo.classTests;
            listeners = trInfo.listeners;
        }

        let i = -1,
            fullSpanPos = 0;
        this.rows = this.data.map(row => {
            if (appendTest && !appendTest(row)) return;
            if (row.__insertRow) {
                // full span row (no columns)
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = this.headers.filter(h => h).length;
                tr.style.display = 'none';
                if (!fullSpanPos % 2) tr.classList.add('table-insert');
                tr.appendChild(td);
                tbody.appendChild(tr);
                fullSpanPos++;

                this.insertRows.push(new ReorderInsertRow(tr));
                return;
            }
            i++;
            let colPos = -1;
            const r = new TableRow(this.headers.map((h, j) => {
                if (!h) return;
                colPos++;

                if (h.calculator) {
                    h.getData = () => { return '' };
                    const td = new TableCell('td', h, row, {
                        rowPos: i,
                        colPos,
                        header: h.title || h.name || h.key
                    });
                    td.el.innerText = "";
                    return td;
                }

                const c = new TableCell('td', h, row, {
                    rowPos: i,
                    colPos,
                    header: h.title || h.name || h.key,
                    minimized: h.__minimized,
                    editable
                });

                const {
                    td,
                    frozen
                } = h;

                if (frozen) {
                    if (j !== 0) console.warn('Frozen columns must be the first column in the table');
                    c.el.style.position = 'sticky';
                    c.el.style.zIndex = 1;
                    c.el.style.left = 0;
                }

                let listeners,
                    attributes,
                    classes,
                    classTests,
                    tooltip;

                if (td) {
                    listeners = td.listeners;
                    attributes = td.attributes;

                    if (attributes && !Array.isArray(attributes)) {
                        attributes = Object.entries(attributes).map(([attribute, value]) => {
                            return {
                                attribute,
                                value
                            }
                        });
                    }

                    classes = td.classes;
                    classTests = td.classTests;
                    tooltip = td.tooltip;
                }

                this.columns[j].cells.push(c);

                if (Array.isArray(listeners)) {
                    listeners.forEach(l => {
                        c.el.addEventListener(l.event, (e) => {
                            if (l.action) {
                                l.action({
                                    event: e,
                                    e,
                                    data: row,
                                    row,
                                    tableRow: r,
                                    tableCell: c
                                });
                            }

                            if (l.callback) {
                                l.callback({
                                    ...e,
                                    __header: this.headers[j],
                                    __row: r,
                                    __cell: c
                                });
                            }
                        });
                    });
                }

                if (Array.isArray(attributes)) {
                    attributes.forEach(a => {
                        c.el.setAttribute(a.name || a.attribute, typeof a.value === 'function' ? a.value(row) : a.value);
                    });
                }

                if (Array.isArray(classTests)) {
                    classTests.forEach(t => {
                        if (t.test(row)) c.el.classList.add(
                            ...(Array.isArray(t.classes) ? t.classes : [t.value])
                        );
                    });
                }

                if (Array.isArray(classes)) {
                    c.el.classList.add(...classes);
                }

                if (Array.isArray(colGroup)) {
                    let col = colGroup.find(c => c.index == j);
                    if (col) {
                        c.el.classList.add(...(Array.isArray(col.classes ? col.classes : [])));

                        if (col.span) {
                            c.el.colSpan = col.span;
                            colPos += col.span - 1;
                        }
                    }
                }

                if (h.__sorted) {
                    if (this.options.sort) {
                        if (Array.isArray(this.options.sort.classes)) c.el.classList.add(...this.options.sort.classes);
                    }
                }

                try {
                    if (tooltip) {
                        const tt = tooltip(row, h.title || h.name || h.key);
                        if (tt) {
                            c.el.title = tt;
                            tdTooltip = true;

                            $(c.el).tooltip({
                                title: tt,
                                placement: 'top',
                                trigger: 'hover'
                            });
                        }
                    }
                } catch (e) {
                    console.error(e);
                }

                return c;
            }).filter(c => c));

            row._rowPos = i;
            r.data = row;
            r.index = i;

            if (Array.isArray(listeners)) {
                listeners.forEach(l => {
                    r.el.addEventListener(l.event || l.type, (e) => {
                        if (l.action) {
                            l.action({
                                event: e,
                                e,
                                data: row,
                                row,
                                tableRow: r
                            });
                        }

                        if (l.callback) {
                            l.callback({
                                ...e,
                                __row: r
                            });
                        }
                    });
                });
            }

            if (Array.isArray(attributes)) {
                attributes.forEach(a => {
                    r.el.setAttribute(a.name || a.attribute, typeof a.value === 'function' ? a.value(row) : a.value);
                });
            }

            if (Array.isArray(classTests)) {
                classTests.forEach(t => {
                    if (t.test(row)) trInfo.classList.add(
                        ...(Array.isArray(t.classes) ? t.classes : [t.class || t.value])
                    );
                });
            }

            if (Array.isArray(classes)) {
                r.el.classList.add(...classes);
            }

            tbody.appendChild(r.el);
            return r;
        }).filter(r => r);

        this.rows.forEach((r, i) => {
            r.el.setAttribute('data-row-pos', i);
            r.cells.forEach((c, j) => {
                c.__row = r;
                c.el.setAttribute('data-row-pos', i);
                c.el.setAttribute('data-col-pos', j);

                c.left = r.cells[j - 1];
                c.right = r.cells[j + 1];
                c.up = this.rows[i - 1] ? this.rows[i - 1].cells[j] : null;
                c.down = this.rows[i + 1] ? this.rows[i + 1].cells[j] : null;
                c.__table = this;
            });

            r.insertRows = {};

            /*
                row 0 => above: insertRows[0], bottom: insertRows[1]
                row 1 => above: insertRows[2], bottom: insertRows[3]
                row 2 => above: insertRows[4], bottom: insertRows[5]
                row 3 => above: insertRows[6], bottom: insertRows[7]
                etc.
            */

            r.insertRows.above = this.insertRows[i * 2];
            r.insertRows.below = this.insertRows[i * 2 + 1];

            if (r.insertRows.above) r.insertRows.above.row = r;
            if (r.insertRows.below) r.insertRows.below.row = r;
        });

        this.headers.forEach((h, i) => {
            if (h.calculator) {
                // console.log(h);
                h.calculator.setCells(this.rows);
            }
        });

        this.el.appendChild(tbody);
    }

    /**
     *  Render the table from the content (useful only with `options.editable`)
     * @returns {void}
     * @memberof Table
     * @private
     * @since 1.0.0
     * @version 1.0.0
     * @example
     * table.renderFromContent();
     */
    renderFromContent() {
        if (!this.rendered) return this.render();

        this.destroy(false);

        [this.this.tableHeaders, ...this.rows].forEach((r, i) => {
            const tr = document.createElement('tr');
            r.cells.forEach((c, j) => {
                const td = document.createElement(i === 0 ? 'th' : 'td');
                td.appendChild(c.el.cloneNode(true));
                tr.appendChild(td);
            });
            this.el.appendChild(tr);
        });
    }




    /**
     *  Sort the table (Called when user clicks on a header)
     * @param {function} [sortFunction] - The function to use to sort the table
     * @param {boolean} [reverse] - Reverse the sort
     * @param {number} [index] - The index of the column to sort
     * @returns {Array} The sorted data
     * @memberof Table
     * @since 1.0.0
     * @version 1.0.0
     * @private
     * @example
     * table.sort((a, b) => a.content[0] - b.content[0], true, 0);
     * table.sort((a, b) => a.content[0].localeCompare(b.content[0]), false, 0);
     * table.sort((a, b) => a.content[0] - b.content[0], true);
     * table.sort((a, b) => a.content[0].localeCompare(b.content[0]), false);
     * table.sort((a, b) => a.content[0] - b.content[0]);
     */
    sort(sortFunction, reverse, index) {
        if (typeof sortFunction !== 'function') {
            sortFunction = (a, b) => {
                if (isNaN(a[index]) || isNaN(b[index])) {
                    return a.content[index].localeCompare(b.content[index]);
                } else {
                    return a.content[index] - b.content[index]
                }
            }
        }

        if (typeof reverse !== 'boolean') {
            // cancel sort
            this.sorted = false;
            return this.originalData;
        }

        this.sorted = true;

        // sort this.data the same way as this.data
        const { rows } = this;
        const newRows = rows.sort(sortFunction);
        if (reverse) newRows.reverse();
        return newRows.map(r => r.data);
    }

    /**
     *  Get the content of the table
     * @returns {Array} The content of the table
     * @memberof Table
     * @since 1.0.0
     * @version 1.0.0
     * @public
     * @example
     * table.content;
     * // => [
     * //     ['Header 1', 'Header 2', 'Header 3'],
     * //     ['Row 1, Col 1', 'Row 1, Col 2', 'Row 1, Col 3']
     * // ]
     */
    get content() {
        return [this.tableHeaders, ...this.rows].map(r => {
            return r.content;
        });
    }

    /**
     *  Adds a state to the table if it is sorted (used for reorder or editable tables)
     */
    update() {
        if (this.sorted) this.stack.addState(this);
    }

    /**
     * Get the content of the table as a JSON string
     * @returns {String} The content of the table as a JSON string
     * @memberof Table
     * @since 1.0.0
     * @version 1.0.0
     * @public
     * @example
     * table.jsonify();
     */
    get json() {
        return JSON.stringify(this.content.filter((_, i) => i !== 0));
    }

    /**
     * Creates a table from various data types (can automatically detect the type)
     * @param {HTMLElement} table - The table element (if using html, must be already populated)
     * @param {String} data - The data to use to populate the table (not needed for html)
     * @param {Object} options - The options to use to create the table
     * @param {String} type - The type of data (json, csv, tsv, html) (if not specified, will be automatically detected, but this may not work for all cases)
     * @returns {Table} The table
     * @memberof Table
     * @since 1.0.0
     * @public
     */
    static from(table, data, options, type) {
        if (!table) {
            throw new Error('Table.from() requires a table element');
        }

        if (!table.querySelector) {
            throw new Error('Table.from() requires a table element');
        }

        if (!type) {
            if (!data) type = 'html';
            else {
                try {
                    JSON.parse(data);
                    type = 'json';
                } catch {
                    // get all commas
                    const commas = data.split(',').length - 1;
                    // get all tabs
                    const tabs = data.split('\t').length - 1;

                    if (commas > tabs) type = 'csv';
                    else type = 'tsv';
                }
            }
        }

        type = type.toLowerCase();

        switch (type) {
            case 'json':
                return Table.fromJSON(table, data, options);
            case 'html':
                return Table.fromHTML(table, options);
            case 'csv':
                return Table.fromCSV(table, data, options);
            case 'tsv':
                return Table.fromTSV(table, data, options);
            default:
                throw new Error('Invalid type, allowed types are: json, html, csv, and tsv. received: ' + type);
        }
    }

    /**
     * Create a table from JSON data
     * @param {String} data - The JSON data (must be an array of arrays or an array of objects with consistent keys)
     * @param {Object} options - The options to use
     * @returns {Table} The table
     * @memberof Table
     * @since 1.1.4
     * @public
     */
    static fromJSON(table, data, options) {
        data = JSON.parse(data);

        let headers = data[0];

        if (Array.isArray(headers)) {
            headers = headers.map(h => {
                return {
                    title: h,
                    getData: d => d[h]
                }
            });

            data.shift();
        } else {
            headers = Object.keys(headers).map(k => {
                return {
                    title: k,
                    getData: d => d[k]
                }
            });
        }

        data = data.map(d => {
            if (Array.isArray(d)) {
                return d.reduce((acc, cur, i) => {
                    acc[headers[i].title] = cur;
                    return acc;
                }, {});
            } else {
                return d;
            }
        });

        return new Table(table, headers, data, options);
    }

    /**
     * Create a table from rendered HTML Table
     * @param {HTMLElement} table Element to get data from 
     * @param {Object} options  Options to pass to the table
     * @returns {Table}
     * @memberof Table
     * @since 1.1.4
     * @public
     */
    static fromHTML(table, options) {
        const headers = Array.from(table.querySelectorAll('thead th')).map(h => {
            return {
                title: h.textContent
            }
        });

        const data = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
            return Array.from(tr.querySelectorAll('td')).reduce((acc, cur, i) => {
                acc[headers[i].title] = cur.textContent;
                return acc;
            }, {});
        });

        return new Table(table, headers, data, {
            ...options,
            __render: false
        });
    }

    /**
     * Create a table from CSV data
     * @param {HTMLElement} table the table element
     * @param {String} data CSV string
     * @param {Object} options Options to pass to the table
     * @returns {Table}
     * @memberof Table
     * @public
     * @since 1.1.4
     */
    static fromCSV(table, data, options) {
        const json = JSON.stringify(parseSV(data, ',', '"'));
        return Table.fromJSON(table, json, options);
    }

    /**
     * Create a table from TSV data
     * @param {HTMLElement} table the table element
     * @param {String} data TSV string 
     * @param {Object} options Options to pass to the table
     * @returns {Table}
     * @memberof Table
     * @since 1.1.4
     * @public
     */
    static fromTSV(table, data, options) {
        const json = JSON.stringify(parseSV(data, '\t', '"'));
        return Table.fromJSON(table, json, options);
    }

    get renderedTable() {
        return new RenderedTable(this.el);
    }

    reset() {
        this.el.innerHTML = '';
        this.render();
    }
}

/**
 *  A table row used for reorderable tables
 */
class ReorderInsertRow {
    constructor(el, row) {
        if (!el.querySelector) throw new Error('Element must be a DOM element');

        this.el = el;

        this.row = row;
    }

    /**
     *  Shows the insert row
     */
    show() {
        this.el.style.display = '';
    }

    /**
     *  Hides the insert row
     */
    hide() {
        this.el.style.display = 'none';
    }
}

/**
 *  A table row
 * @private
 */
class TableRow {
    /**
     * 
     * @param {Array<TableCell>} cells The cells of the row 
     */
    constructor(cells) {
        this.cells = cells;

        this.render();
    }

    /**
     *  Render the row
     */
    render() {
        this.el = document.createElement('tr');
        this.cells.forEach(cell => {
            this.el.appendChild(cell.el);
        });
    }

    /**
     *  Get the content of the row
     *  @returns {Object} The content of the row
     */
    get content() {
        return this.cells.reduce((acc, cur) => {
            acc[cur.headerTitle] = cur.content;
            return acc;
        }, {});
    }
}

/**
 *  A table column
 * @private
 */
class TableColumn {
    /**
     * 
     * @param {Array<TableCell>} cells The cells of the column
     * @param {TableHeader} header The header of the column
     */
    constructor(cells, header) {
        this.cells = cells;
        this.header = header;
    }

    get content() {
        return this.cells.map(c => c.content);
    }
}

/**
 *  A table cell
 * @private
 */
class TableCell {
    /**
     * 
     * @param {String} type The type of the cell (td or th)
     * @param {TableHeader} header The header of the cell 
     * @param {TableRow} row The row of the cell 
     * @param {Object} options The options for the cell
     * @param {Number} options.rowPos The position of the row
     * @param {Number} options.colPos The position of the column
     * @param {Boolean} options.minimized Whether or not the cell is minimized
     * @param {Object} options.editable The editable options for the cell
     * @param {Function} options.editable.onChange The function to call when the cell is changed
     * @param {Function} options.editable.onCancel The function to call when the cell is canceled
     */
    constructor(type, header, row, {
        rowPos,
        colPos,
        minimized,
        editable,
        frozen
    }) {
        // console.log(header);
        this.content = header.getData ? header.getData(row) : row[header.title || header.name || header.key];
        this.type = type;
        this.colPos = colPos;
        this.rowPos = rowPos;
        this.headerTitle = header.title;
        this.frozen = frozen;
        this.header = header;
        this.editable = editable;
        this.onChange = editable ? editable.onChange : () => {};
        this.onCancel = editable ? editable.onCancel : () => {};

        if (!minimized) this.render();
        else this.el = document.createElement('td');

        this.stack = new Table_StateStack();
        this.stack.addState(this.content);

        this.stack.onChange = (state) => {
            // console.log('state changed');
            this.content = state;

            this.render();
        }

        this.stack.onChangeUnsaved = (state) => {
            if (!this.viewingUnsaved) return;
            if (state || state == '') {
                // console.log('Rendering unsaved state: ', state);
                this.el.innerText = state;
            }
        }
    }

    /**
     *  Render the cell
     */
    render() {
        this.el = document.createElement(this.type);

        this.el.dataset.colPos = this.colPos;
        this.el.dataset.rowPos = this.rowPos;
        this.el.dataset.header = this.headerTitle;

        if (this.content.querySelector) {
            if (this.editable) throw new Error('Editable cells cannot contain HTML elements');
            this.el.appendChild(this.content);
        } else {
            this.el.innerHTML = this.content;
            if (this.editable) {
                this.el.setAttribute('title', `
Press Ctrl + Enter to save
Press Escape to cancel
Press Ctrl + Z to undo
Press Ctrl + Y to redo
Press Ctrl + Arrow Keys to move between cells
Leaving the cell will cancel the changes
                `);

                let edit = false;

                this.el.setAttribute('contenteditable', 'true');

                const change = () => {
                    this.onChange({
                        row: this.__row,
                        cell: this,
                        value: this.el.innerText,
                        previousValue: this.content
                    });
                    this.stack.addState(this.el.innerText);
                    this.el.blur();
                }

                const cancel = () => {
                    if (edit) return edit = false;
                    this.viewingUnsaved = false;
                    this.stack.addUnsavedState(this.el.innerText);
                    this.el.innerHTML = this.content;
                    this.onCancel({
                        row: this.__row,
                        cell: this,
                        value: this.el.innerText
                    });

                    edit = true;
                    this.el.blur();
                }

                this.el.onblur = cancel;

                this.el.addEventListener('keyup', (e) => {
                    if (e.key == 'Alt') {
                        e.preventDefault();
                        this.el.innerText = this.stack.currentState;
                        return this.viewingUnsaved = false;
                    }
                });

                this.el.addEventListener('keydown', (e) => {
                    switch (e.key) {
                        case 'Escape':
                            cancel();
                            break;
                    }
                    if (e.altKey) {
                        e.preventDefault();
                        this.viewingUnsaved = true;
                        this.stack.resolveUnsaved();
                        // console.log(this.stack.currentUnsavedState, this.stack.currentUnsavedIndex);
                        switch (e.key) {
                            case 'ArrowUp':
                                e.preventDefault();
                                this.stack.prevUnsaved();
                                break;
                            case 'ArrowDown':
                                e.preventDefault();
                                this.stack.nextUnsaved();
                                break;
                        }
                        // this.stack.onChangeUnsaved();
                        // switch (e.key) {
                        //     case 'ArrowLeft':

                        // }
                        return;
                    }
                    if (e.ctrlKey) {
                        // shift key

                        switch (e.key) {
                            case 'z':
                                this.stack.prev();
                                break;
                            case 'y':
                                this.stack.next();
                                break;
                            case 'Enter':
                                change();
                                edit = true;
                                break;
                                // arrow keys
                            case 'ArrowUp':
                                e.preventDefault();
                                if (this.up) this.up.el.focus();
                                break;
                            case 'ArrowDown':
                                e.preventDefault();
                                if (this.down) this.down.el.focus();
                                break;
                            case 'ArrowLeft':
                                e.preventDefault();
                                if (this.left) this.left.el.focus();
                                break;
                            case 'ArrowRight':
                                e.preventDefault();
                                if (this.right) this.right.el.focus();
                                break;
                        }
                    }
                });
            }
        }
    }

    /**
     * Change the content of the cell
     * @param {String} content The new content of the cell
     */
    changeContent(content) {
        this.stack.addState(content);
    }
}

/**
 *  A table header
 * @private
 */
class TableHeader {
    /**
     * 
     * @param {HTMLElement | String} content The content of the header
     * @param {Object} options The options for the header 
     */
    constructor(content, options) {
        this.options = options || {};
        this.el = document.createElement('th');

        this.content = content;

        this.render();
    }

    render() {
        if (this.content.querySelector) {
            this.el.appendChild(this.content);
        } else {
            this.el.innerHTML = this.content;
        }
    }

    /**
     * Change the content of the header
     * @param {HTMLElement | String} content The new content of the header
     */
    changeContent(content) {
        this.content = content;
        this.render();
    }
}

/**
 *  A table footer
 * @private
 * @extends TableHeader
 */
class TableFooter extends TableHeader {
    /**
     * 
     * @param  {...any} args The arguments for the header
     */
    constructor(...args) {
        super(...args);
    }
}