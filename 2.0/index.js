"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Table_v2_container;
class Table_v2 extends TableElement {
    static build(table, headers, data, options) {
        if (!(table instanceof HTMLTableElement))
            throw new Error('Table.build() expects a table element as the first argument.');
        const t = new Table_v2(table);
        if (options.caption) {
            t.addCaption(options.caption);
        }
        const head = t.addHead();
        const setListeners = (component, listeners) => {
            if (Array.isArray(listeners)) {
                listeners.forEach(l => {
                    component.on(l.event, l.callback);
                });
            }
            else if (typeof listeners === 'object') {
                Object.keys(listeners).forEach(event => {
                    listeners[event].forEach(l => {
                        component.on(event, l.callback);
                    });
                });
            }
        };
        const setAttributes = (component, attributes) => {
            if (Array.isArray(attributes)) {
                attributes.forEach(a => {
                    const name = a.name || a.attribute;
                    const value = a.value || a.test(component);
                    if (name && value)
                        component.el.setAttribute(name, value);
                });
            }
            else if (typeof attributes === 'object') {
                Object.entries(attributes).forEach(([name, value]) => {
                    if (!name || typeof name !== 'string')
                        return;
                    if (typeof value === 'function') {
                        value = value(component);
                    }
                    if (value)
                        component.el.setAttribute(name, value);
                });
            }
        };
        const setClasses = (component, classes) => {
            if (Array.isArray(classes))
                classes.forEach(c => {
                    component.el.classList.add(c);
                });
        };
        const classTests = (component, testArr) => {
            if (Array.isArray(testArr))
                testArr.forEach(t => {
                    if (t.test(component)) {
                        if (t.class)
                            component.el.classList.add(t.class);
                        if (t.classes)
                            t.classes.forEach(c => component.el.classList.add(c));
                    }
                });
        };
        headers.forEach(header => {
            const h = head.addHeader(header.title);
            if (header.th) {
                if (header.th.listeners)
                    setListeners(h, header.th.listeners);
                if (header.th.attributes)
                    setAttributes(h, header.th.attributes);
                if (header.th.classes)
                    setClasses(h, header.th.classes);
                if (header.th.classTests)
                    classTests(h, header.th.classTests);
            }
        });
        const body = t.addBody();
        head.body = body;
        data.forEach(row => {
            if (options.appendTest) {
                if (!options.appendTest(row))
                    return;
            }
            const r = body.addRow(...headers.map(h => {
                return h.getData(row);
            }));
            r.cells.forEach((c, i) => {
                const header = headers[i];
                if (header.td) {
                    if (header.td.listeners)
                        setListeners(c, header.td.listeners);
                    if (header.td.attributes)
                        setAttributes(c, header.td.attributes);
                    if (header.td.classes)
                        setClasses(c, header.td.classes);
                    if (header.td.classTests)
                        classTests(c, header.td.classTests);
                }
            });
            if (options.tr) {
                if (options.tr.listeners)
                    setListeners(r, options.tr.listeners);
                if (options.tr.attributes)
                    setAttributes(r, options.tr.attributes);
                if (options.tr.classes)
                    setClasses(r, options.tr.classes);
                if (options.tr.classTests)
                    classTests(r, options.tr.classTests);
            }
        });
        return t;
    }
    constructor(htmlTableElement) {
        super(htmlTableElement);
        _Table_v2_container.set(this, void 0);
        this.components = [];
    }
    addBody() {
        const body = new TableBody(this);
        this.components.push(body);
        this.el.appendChild(body.el);
        return body;
    }
    addHead() {
        const head = new TableHead(this);
        this.components.push(head);
        this.el.appendChild(head.el);
        return head;
    }
    addFoot() {
        const foot = new TableFoot(this);
        this.components.push(foot);
        this.el.appendChild(foot.el);
        return foot;
    }
    addCaption(caption) {
        const captionElement = new TableCaption(caption);
        this.components.push(captionElement);
        this.el.appendChild(captionElement.el);
        return captionElement;
    }
    // customization
    datatable(options) {
        const el = $(this.el);
        if (el.hasOwnProperty('DataTable')) {
            el.DataTable(options);
        }
    }
    bootstrap(options) {
        if (options.color) {
            this.el.classList.add(`table-${options.color}`);
        }
        if (options.striped) {
            this.el.classList.add('table-striped');
        }
        if (options.hover) {
            this.el.classList.add('table-hover');
        }
        if (options.border) {
            this.el.classList.add('table-bordered');
        }
        if (Array.isArray(options.other)) {
            if (options.other.length)
                this.el.classList.add(...options.other);
        }
        if (options.responsive) {
            const div = document.createElement('div');
            div.classList.add('table-responsive');
            if (this.el.parentElement)
                this.el.parentElement.replaceChild(div, this.el);
            div.appendChild(this.el);
            this.container = div;
            return div;
        }
    }
    // post-render operations
    copy(type) {
        const separate = (delimiter, escape) => {
            const rows = this.components.map(component => {
                if (component instanceof TableBody) {
                    return component.rows;
                }
                else if (component instanceof TableHead) {
                    return [component.row];
                }
                else
                    return [];
            }).filter(c => c.length).flat();
            const escapeRegex = new RegExp(escape, 'g');
            const delimiterRegex = new RegExp(delimiter, 'g');
            const data = rows.map(row => {
                return row.cells.map(cell => {
                    const { textContent } = cell.el;
                    return textContent === null || textContent === void 0 ? void 0 : textContent.replace(escapeRegex, escape + escape).replace(delimiterRegex, escape + delimiter);
                }).join(delimiter);
            }).join('\n');
            return data;
        };
        switch (type) {
            case 'csv':
                return separate(',', '"');
            case 'json':
                return (() => {
                    const components = this.components.map(component => {
                        if (component instanceof TableBody) {
                            if (component.head) {
                                return component.rows.map(row => {
                                    return row.cells.reduce((acc, cur, i) => {
                                        var _a, _b, _c;
                                        const header = (_a = component.head) === null || _a === void 0 ? void 0 : _a.row.cells[i];
                                        if (header) {
                                            acc[(_b = header.el.textContent) !== null && _b !== void 0 ? _b : ''] = (_c = cur.el.textContent) !== null && _c !== void 0 ? _c : '';
                                        }
                                        return acc;
                                    }, {});
                                });
                            }
                        }
                    });
                    return JSON.stringify(components);
                })();
            case 'tsv':
                return separate('\t', '"');
            case 'html':
                return (() => {
                    const table = document.createElement('table');
                    table.innerHTML = this.el.innerHTML;
                    // remove all classes, styling, and attributes
                    table.querySelectorAll('*').forEach(el => {
                        el.removeAttribute('class');
                        el.removeAttribute('style');
                        el.removeAttribute('id');
                        el.removeAttribute('data');
                    });
                    return table.outerHTML;
                })();
            default:
                return console.error('Invalid copy type. Allowed', ['csv', 'tsv', 'json', 'html']);
        }
    }
    // getters and setters
    get container() {
        return __classPrivateFieldGet(this, _Table_v2_container, "f");
    }
    set container(value) {
        __classPrivateFieldSet(this, _Table_v2_container, value, "f");
    }
}
_Table_v2_container = new WeakMap();
var _TableCell_content;
class TableCell extends TableElement {
    constructor(content, table) {
        const el = document.createElement('td');
        super(el);
        _TableCell_content.set(this, void 0);
        this.table = table;
        this.content = content;
        __classPrivateFieldSet(this, _TableCell_content, content, "f"); // not necessary, but it's to trick the compiler
    }
    get content() {
        return __classPrivateFieldGet(this, _TableCell_content, "f");
    }
    set content(content) {
        if (typeof content === 'string' || typeof content === 'number') {
            this.el.innerHTML = content.toString();
        }
        else if (content instanceof HTMLElement) {
            this.el.appendChild(content);
        }
        __classPrivateFieldSet(this, _TableCell_content, content, "f");
    }
}
_TableCell_content = new WeakMap();
class TableDataCell extends TableCell {
    constructor(content, table) {
        super(content, table);
    }
}
;
class TableHeaderCell extends TableCell {
    constructor(content, table) {
        super(content, table);
        this.el = document.createElement('th');
    }
}
var _TableBody_head;
class TableBody extends TableElement {
    constructor(table) {
        const el = document.createElement('tbody');
        super(el);
        _TableBody_head.set(this, void 0);
        this.rows = [];
        this.table = table;
    }
    set head(header) {
        __classPrivateFieldSet(this, _TableBody_head, header, "f");
    }
    get head() {
        return __classPrivateFieldGet(this, _TableBody_head, "f");
    }
    addRow(...cells) {
        const newRow = new TableRow(this.table);
        this.rows.push(newRow);
        this.el.appendChild(newRow.el);
        newRow.addCells(...cells);
        return newRow;
    }
    addRows(...rows) {
        return rows.map(row => {
            return this.addRow(...row);
        });
    }
}
_TableBody_head = new WeakMap();
var _TableCaption_content;
class TableCaption extends TableElement {
    constructor(caption) {
        const el = document.createElement('caption');
        super(el);
        _TableCaption_content.set(this, void 0);
        if (caption) {
            this.content = caption;
        }
        __classPrivateFieldSet(this, _TableCaption_content, caption, "f");
    }
    get content() {
        return __classPrivateFieldGet(this, _TableCaption_content, "f");
    }
    set content(caption) {
        if (typeof caption === 'string' || typeof caption === 'number') {
            this.el.innerHTML = caption.toString();
        }
        else if (caption instanceof HTMLElement) {
            this.el.appendChild(caption);
        }
        __classPrivateFieldSet(this, _TableCaption_content, caption, "f");
    }
}
_TableCaption_content = new WeakMap();
class TableFoot extends TableElement {
    constructor(table) {
        const el = document.createElement('tfoot');
        super(el);
        this.table = table;
    }
}
var _TableHead_body;
class TableHead extends TableElement {
    constructor(table) {
        const el = document.createElement('thead');
        super(el);
        _TableHead_body.set(this, void 0);
        this.table = table;
        this.row = new TableRow(table);
        this.el.appendChild(this.row.el);
        this.columns = [];
    }
    addHeader(content, options) {
        const th = new TableHeaderCell(content, this.table);
        this.row.addCell(th);
        const column = new TableColumn(options, this.row.cells.length - 1, this);
        this.columns.push(column);
        return th;
    }
    get body() {
        return __classPrivateFieldGet(this, _TableHead_body, "f");
    }
    set body(body) {
        if (!(body instanceof TableBody)) {
            throw new Error('The body must be an instance of TableBody');
        }
        __classPrivateFieldSet(this, _TableHead_body, body, "f");
        __classPrivateFieldGet(this, _TableHead_body, "f").head = this;
    }
}
_TableHead_body = new WeakMap();
var _TableElement_data;
class TableElement {
    constructor(el) {
        _TableElement_data.set(this, void 0);
        this.el = el;
        this.listeners = [];
        this.events = {};
        this.stack = new Table_StateStack();
    }
    on(event, callback) {
        if (typeof event !== 'string') {
            return console.error('Table.on() requires a string as the first argument.');
        }
        if (typeof callback !== 'function') {
            return console.error('Table.on() requires a function as the second argument.');
        }
        if (!this.events[event]) {
            this.events[event] = (e) => {
                return Promise.all(this.listeners.filter(l => {
                    return l.event === event;
                }).map(l => {
                    return l.callback(e);
                }));
            };
            this.el.addEventListener(event, this.events[event]);
        }
        this.listeners.push(new TableListener(event, callback));
    }
    off(event, callback) {
        if (!event) {
            Object.keys(this.events).forEach(event => {
                this.el.removeEventListener(event, this.events[event]);
                delete this.events[event];
            });
            this.listeners = [];
            return;
        }
        if (event && !callback) {
            this.listeners = this.listeners.filter(l => l.event !== event);
            delete this.events[event];
            return;
        }
        this.listeners = this.listeners.filter(l => {
            return l.event !== event || l.callback !== callback;
        });
        if (!this.listeners.filter(l => l.event === event).length) {
            this.el.removeEventListener(event, this.events[event]);
            delete this.events[event];
        }
    }
    set data(data) {
        __classPrivateFieldSet(this, _TableElement_data, data, "f");
    }
    get data() {
        return __classPrivateFieldGet(this, _TableElement_data, "f");
    }
}
_TableElement_data = new WeakMap();
class TableListener {
    constructor(event, callback) {
        this.event = event;
        this.callback = callback;
    }
}
class Table_StateStack {
}
class TableColGroup {
}
;
class TableColumn {
    constructor(options = {
        render: () => { },
        sort: () => { },
        filter: () => { }
    }, index, head) {
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
class TableRow extends TableElement {
    constructor(table) {
        const el = document.createElement('tr');
        super(el);
        this.table = table;
        this.cells = [];
    }
    addCell(content) {
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
    addCells(...contents) {
        contents.forEach(content => {
            this.addCell(content);
        });
    }
}
