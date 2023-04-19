class Table_v2 extends TableElement {
    static build(table:HTMLTableElement, headers:TableV1Header[], data:any[], options:TableV1Options):Table_v2 {
        if (!(table instanceof HTMLTableElement)) throw new Error('Table.build() expects a table element as the first argument.');
        
        const t = new Table_v2(table);

        if (options.caption) {
            t.addCaption(options.caption);
        }

        const head = t.addHead();

        const setListeners = (component:TableElement, listeners:TableV1Listener[]|TableV1ListenerGroup) => {
            if (Array.isArray(listeners)) {
                listeners.forEach(l => {
                    component.on(l.event, l.callback);
                });
            } else if (typeof listeners === 'object') {
                Object.keys(listeners).forEach(event => {
                    listeners[event].forEach(l => {
                        component.on(event, l.callback);
                    });
                });
            }
        };

        const setAttributes = (component:TableElement, attributes:TableV1Attribute[]|TableV1AttributeGroup) => {
            if (Array.isArray(attributes)) {
                attributes.forEach(a => {
                    const name = a.name || a.attribute;
                    const value = a.value || a.test(component);
                    if (name && value) component.el.setAttribute(name, value);
                });
            } else if (typeof attributes === 'object') {
                Object.entries(attributes).forEach(([name, value]) => {
                    if (!name || typeof name !== 'string') return;
                    if (typeof value === 'function') {
                        value = value(component);
                    }

                    if (value) component.el.setAttribute(name, value);
                })
            }
        };


        const setClasses = (component:TableElement, classes:string[]) => {
            if (Array.isArray(classes)) classes.forEach(c => {
                component.el.classList.add(c);
            });
        }


        const classTests = (component:TableElement, testArr:TableV1ClassTestObj[]) => {
            if (Array.isArray(testArr)) testArr.forEach(t => {
                if (t.test(component)) {
                    if (t.class) component.el.classList.add(t.class);
                    if (t.classes) t.classes.forEach(c => component.el.classList.add(c));
                }
            });
        }

        headers.forEach(header => {
            const h = head.addHeader(header.title);

            if (header.th) {
                if (header.th.listeners) setListeners(h, header.th.listeners);
                if (header.th.attributes) setAttributes(h, header.th.attributes);
                if (header.th.classes) setClasses(h, header.th.classes);
                if (header.th.classTests) classTests(h, header.th.classTests);
            }
        });

        const body = t.addBody();
        head.body = body;

        data.forEach(row => {
            if (options.appendTest) {
                if (!options.appendTest(row)) return;
            }

            const r = body.addRow(...headers.map(h => {
                return h.getData(row);
            }));

            r.cells.forEach((c,i) => {
                const header = headers[i];

                if (header.td) {
                    if (header.td.listeners) setListeners(c, header.td.listeners);
                    if (header.td.attributes) setAttributes(c, header.td.attributes);
                    if (header.td.classes) setClasses(c, header.td.classes);
                    if (header.td.classTests) classTests(c, header.td.classTests);
                }
            });

            if (options.tr) {
                if (options.tr.listeners) setListeners(r, options.tr.listeners);
                if (options.tr.attributes) setAttributes(r, options.tr.attributes);
                if (options.tr.classes) setClasses(r, options.tr.classes);
                if (options.tr.classTests) classTests(r, options.tr.classTests);
            }
        });

        return t;
    }













    #container?:HTMLDivElement;
    components:TableElement[];

    constructor(htmlTableElement:HTMLTableElement) {
        super(htmlTableElement);

        this.components = [];
    }

    addBody():TableBody {
        const body = new TableBody(this);
        this.components.push(body);
        this.el.appendChild(body.el);
        return body;
    }

    addHead():TableHead {
        const head = new TableHead(this);
        this.components.push(head);
        this.el.appendChild(head.el);
        return head;
    }

    addFoot():TableFoot {
        const foot = new TableFoot(this);
        this.components.push(foot);
        this.el.appendChild(foot.el);
        return foot;
    }

    addCaption(caption:string|HTMLElement):TableCaption {
        const captionElement = new TableCaption(caption);
        this.components.push(captionElement);
        this.el.appendChild(captionElement.el);
        return captionElement;
    }


















    // customization

    datatable(options:object):void {
        const el = $(this.el);
        if (el.hasOwnProperty('DataTable')) {
            el.DataTable(options);
        }
    }

    bootstrap(options:BootstrapOptions) {
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
            if (options.other.length) this.el.classList.add(...options.other);
        }

        if (options.responsive) {
            const div = document.createElement('div');
            div.classList.add('table-responsive');
            if (this.el.parentElement) this.el.parentElement.replaceChild(div, this.el);
            div.appendChild(this.el);

            this.container = div;

            return div;
        }
        
    }







    // post-render operations

    copy(type:string):string|void {
        const separate = (delimiter:string, escape:string):string => {
            const rows = this.components.map(component => {
                if (component instanceof TableBody) {
                    return component.rows;
                } else if (component instanceof TableHead) {
                    return [component.row];
                } else return [];
            }).filter(c => c.length).flat();

            const escapeRegex = new RegExp(escape, 'g');
            const delimiterRegex = new RegExp(delimiter, 'g');

            const data = rows.map(row => {
                return row.cells.map(cell => {
                    const {textContent} =  cell.el;
                    return textContent?.replace(escapeRegex, escape + escape).replace(delimiterRegex, escape + delimiter);
                }).join(delimiter);
            }).join('\n');

            return data;
        }

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
                                        const header = component.head?.row.cells[i];
                                        if (header) {
                                            acc[header.el.textContent ?? ''] = cur.el.textContent ?? '';
                                        }
                                        return acc;
                                    }, {} as {[key:string]:string});
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

    get container():HTMLDivElement|undefined {
        return this.#container;
    }

    set container(value:HTMLDivElement|undefined) {
        this.#container = value;
    }
}