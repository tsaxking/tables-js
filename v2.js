// document.addEventListener('DOMContentLoaded', () => {
//     // get bootstrap javascript, material icons, and jquery
//     [
//         "https://code.jquery.com/jquery-3.1.1.min.js",
//         "https://cdn.datatables.net/v/dt/dt-1.11.5/datatables.min.js",
//         "https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.2/dist/umd/popper.min.js"
//     ].forEach(src => {
//         const script = document.createElement('script');
//         script.src = src;
//         document.head.appendChild(script);
//     });


// });

class Table {
    constructor(table, headers, data, options) {
        if (!table.querySelector) {
            console.log(table);
            throw new Error('Table must be an HTML element');
        }
        this.el = table;
        this.rows = [];
        this.columns = new Array(headers.length).fill();
        this.headers = headers;
        this.options = options || {};
        this.originalData = [...data];
        this.data = data;

        this.sections = {}

        this.render();
    }

    render() {
        const {
            evenColumns,
            reorder
        } = this.options;
        this.el.innerHTML = '';

        if (Array.isArray(this.options.classes)) {
            this.el.classList.add(...this.options.classes);
        }

        if (reorder) {
            if (!this.options.trAttributes) this.options.trAttributes = [];

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

            const dragStart = ({ event }) => {
                const tr = event.target.closest('tr');
                tr.style.cursor = 'grabbing';
                tr.style.userSelect = 'none';
                tr.style.position = 'fixed';

                const { x, y } = getXY(event);
                tr.dataset.x = x;
                tr.dataset.y = y;
            };

            const dragging = ({ event }) => {
                const tr = event.target.closest('tr');
                if (tr.style.position !== 'fixed') return;

                const { x, y } = getXY(event);
                const dx = x - tr.dataset.x;
                const dy = y - tr.dataset.y;

                tr.style.transform = `translate(${dx}px, ${dy}px)`;

                // const swap = document.elementFromPoint(x, y).closest('tr[data-swap="true"]');
                // if (swap) {
                //     swap.style.transform = `translateY(${dy}px)`;
                // }
            };

            const dragEnd = (e) => {
                const tr = e.event.target.closest('tr');
                tr.style.cursor = '';
                tr.style.userSelect = '';
                tr.style.position = '';
                tr.style.transform = '';
            };

            this.options.trAttributes.push({
                attribute: 'data-swap',
                value: 'false'
            }, {
                attribute: 'data-insert',
                value: 'false'
            });

            this.headers.unshift({
                title: 'Drag',
                getData: () => {
                    const i = document.createElement('i');
                    i.classList.add('material-icons');
                    i.innerText = 'drag_indicator';

                    i.style.cursor = 'grab';
                    return i;
                },
                listeners: [{
                    event: 'mousedown',
                    action: dragStart
                }, {
                    event: 'touchstart',
                    action: dragStart
                }, {
                    event: 'mousemove',
                    action: dragging
                }, {
                    event: 'touchmove',
                    action: dragging
                }, {
                    event: 'mouseup',
                    action: dragEnd
                }, {
                    event: 'touchend',
                    action: dragEnd
                }, {
                    event: 'mouseleave',
                    action: dragEnd
                }, {
                    event: 'touchcancel',
                    action: dragEnd
                }]
            });

            // insert a full span row between each row
            this.data = this.data.reduce((a, c, i) => {
                if (i === 0) return [c];
                return [...a, { // insert 2 for stripes
                        fullSpan: true
                    }, {
                        fullSpan: true
                    },
                    c
                ];
            }, []);
        }

        this.renderHeaders();
        this.renderRows();


        if (evenColumns) {
            const width = this.el.offsetWidth;
            this.columns.forEach(col => {
                col.cells.forEach(cell => {
                    cell.el.style.width = `${width / this.columns.length}px`;
                });
            });
        }
    }

    renderHeaders() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        this.columns = this.headers.map(h => {
            if (!h) return;
            const th = new TableHeader(h.title);
            tr.appendChild(th.el);

            return new TableColumn([th]);
        }).filter(h => h);

        thead.appendChild(tr);
        this.el.appendChild(thead);
    }

    renderRows() {
        const tbody = document.createElement('tbody');

        const {
            trListeners,
            appendTest,
            trAttributes,
            trCLassTests,
            trClasses,
            colGroup
        } = this.options;

        let tdTooltip = false;

        let i = -1,
            fullSpanPos = 0;
        this.rows = this.data.map(row => {
            if (appendTest && !appendTest(row)) return;
            if (row.fullSpan) {
                // full span row (no columns)
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = this.headers.filter(h => h).length;
                tr.style.display = 'none';
                if (!fullSpanPos % 2) tr.classList.add('table-insert');
                tr.appendChild(td);
                tbody.appendChild(tr);
                fullSpanPos++;
                return;
            }
            i++;
            let colPos = -1;
            const r = new TableRow(this.headers.map((h, j) => {
                if (!h) return;
                colPos++;
                const c = new TableCell('td', h, row, {
                    rowPos: i,
                    colPos,
                    header: h.title || h.name || h.key,
                });

                this.columns[j].cells.push(c);

                if (Array.isArray(h.listeners)) {
                    h.listeners.forEach(l => {
                        c.addEventListener(l.event, (e) => {
                            l.action({
                                event: e,
                                e,
                                data: row,
                                row,
                                tableRow: r,
                                tableCell: c
                            });
                        });
                    });
                }

                if (Array.isArray(h.attributes)) {
                    h.attributes.forEach(a => {
                        c.el.setAttribute(a.name || a.attribute, typeof a.value === 'function' ? a.value(row) : a.value);
                    });
                }

                if (Array.isArray(h.classTests)) {
                    h.classTests.forEach(t => {
                        if (t.test(row)) c.el.classList.add(
                            ...(Array.isArray(t.classes) ? t.classes : [t.value])
                        );
                    });
                }

                if (Array.isArray(h.classes)) {
                    c.el.classList.add(...h.classes);
                }

                if (Array.isArray(h.tdClasses)) {
                    c.el.classList.add(...h.tdClasses);
                }

                if (Array.isArray(colGroup)) {
                    let col = colGroup.find(c => c.index == j);
                    if (col) c.el.classList.add(...col.classes);
                }

                try {
                    if (h.tdTooltip) {
                        const tooltip = tdTooltip(row, h.title || h.name || h.key)
                        if (tooltip) {
                            c.el.title = tooltip;
                            tdTooltip = true;
                        }
                    }
                } catch {}

                return c;
            }).filter(c => c));
            row._rowPos = i;
            r.data = row;
            r.index = i;

            if (Array.isArray(trListeners)) {
                trListeners.forEach(l => {
                    r.el.addEventListener(l.event || l.type, (e) => {
                        l.action({
                            event: e,
                            e,
                            data: row,
                            row,
                            tableRow: r
                        });
                    });
                });
            }

            if (Array.isArray(trAttributes)) {
                trAttributes.forEach(a => {
                    r.el.setAttribute(a.name || a.attribute, typeof a.value === 'function' ? a.value(row) : a.value);
                });
            }

            if (Array.isArray(trCLassTests)) {
                trCLassTests.forEach(t => {
                    if (t.test(row)) tr.classList.add(
                        ...(Array.isArray(t.classes) ? t.classes : [t.value])
                    );
                });
            }

            if (Array.isArray(trClasses)) {
                r.el.classList.add(...trClasses);
            }

            tbody.appendChild(r.el);
            return r;
        }).filter(r => r);

        this.el.appendChild(tbody);
    }

}

class TableRow {
    constructor(cells) {
        this.cells = cells;

        this.render();
    }

    render() {
        this.el = document.createElement('tr');
        this.addEventListener = this.el.addEventListener.bind(this.el);
        this.querySelector = this.el.querySelector.bind(this.el);
        this.querySelectorAll = this.el.querySelectorAll.bind(this.el);
        this.cells.forEach(cell => {
            this.el.appendChild(cell.el);
        });
    }
}

class TableColumn {
    constructor(cells) {
        this.cells = cells;
    }
}

class TableCell {
    constructor(type, header, row, {
        rowPos,
        colPos
    }) {
        this.content = header.getData ? header.getData(row) : row[header.title || header.name || header.key];
        this.type = type;
        this.colPos = colPos;
        this.rowPos = rowPos;
        this.headerTitle = header.title;

        this.render();
    }

    render() {
        this.el = document.createElement(this.type);

        this.el.dataset.colPos = this.colPos;
        this.el.dataset.rowPos = this.rowPos;
        this.el.dataset.header = this.headerTitle;

        this.addEventListener = this.el.addEventListener.bind(this.el);
        this.querySelector = this.el.querySelector.bind(this.el);
        this.querySelectorAll = this.el.querySelectorAll.bind(this.el);

        if (this.content.querySelector) {
            this.el.appendChild(this.content);
        } else {
            this.el.innerHTML = this.content;
        }
    }

    changeContent(content) {
        this.content = content;
        this.render();
    }
}

class TableHeader {
    constructor(content, options) {
        this.options = options || {};
        this.el = document.createElement('th');

        this.addEventListener = this.el.addEventListener.bind(this.el);
        this.querySelector = this.el.querySelector.bind(this.el);
        this.querySelectorAll = this.el.querySelectorAll.bind(this.el);


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
}

class TableFooter extends TableHeader {
    constructor(...args) {
        super(...args);
    }
}

// class TableBody {
//     constructor(rows) {
//         this.rows = rows;

//         this.render();
//     }

//     render() {
//         this.el = document.createElement('tbody');
//         this.rows.forEach(row => {
//             this.el.appendChild(row.el);
//         });
//     }
// }