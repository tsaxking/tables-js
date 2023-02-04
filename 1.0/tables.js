/**
 * @description Creates a table from an element, headers, and data. You can add in event listeners if you like! Fully customizable
 * @param {Element} table Table Element
 * @param {Array} headers Header: {title: 'String', getData: (rowData) => {how to get content to place into <td></td>}, listeners: (OPTIONAL) [{type: 'listener type', action: (rowData) => {what to do on listener}}]
 * @param {Array} data Each item is a row, structure it how you like. getData(data[n]) and action(data[n]) use this
 * @param {Object} options (optional) see below
 * 
 * @example
 *  ```javascript
 *  const tableOptions = {
 *      appendTest: (row) => {}, // function: must return a boolean, if true, will append the tr to the table. Parameter is the row
 *      trListeners: [], // array of objects: {type: 'listener type', action: ({ row, tr, event }) => { // what to do on listener}}
 *      trAttributes: [], // array of objects: {type: 'attribute type', value: (row) => { function to get attribute }}
 *      dataTable: false, // boolean: if true, will create a data table using jquery dataTable, this requires the table to have an id
 *      colGroup: [], // array of objects: { index: 0, classes: ['class'] }
 *      trClassTests: [], // array of objects: { test: (row) => { function to test row }, value: 'class' }
 *      evenColumns: false, // boolean: if true, will make all columns the same width
 *      trClasses: [], // array of strings: ['class1', 'class2']
 *      onEdit: (row, column, newValue) => {} // function: what to do when a row is edited, this will make the table a spreadsheet. DO NOT USE WITH ANY OTHER OPTION
 *  }
 *  ```
 * 
 * @deprecated
 */
function setTable(table, headers, data, options) {
    let appendTest = null,
        trListeners = [],
        trAttributes = [],
        dataTable = false,
        datatable = false,
        colGroup = null,
        trClassTests = [],
        evenColumns = null,
        trClasses = [],
        reorder = null,
        onEdit = null,
        editing = false,
        tooltips = false,
        tdTooltip = false;

    if (options) {
        appendTest = options.appendTest;
        onEdit = options.onEdit;
        editing = typeof onEdit == 'function';
        if (Array.isArray(options.trListeners)) trListeners = options.trListeners;
        if (Array.isArray(options.trAttributes)) trAttributes = options.trAttributes;
        dataTable = options.dataTable;
        datatable = options.datatable;
        if (Array.isArray(options.colGroup)) colGroup = options.colGroup;
        if (Array.isArray(options.trClassTests)) trClassTests = options.trClassTests;
        evenColumns = options.evenColumns;
        if (Array.isArray(options.trClasses)) trClasses = options.trClasses;
        reorder = options.reorder;
    }

    table.innerHTML = ''; // Clears the table

    let thead = document.createElement('thead'); // Creates headers div
    let tfoot = document.createElement('tfoot'); // Creates footers div

    let theadRow = document.createElement('tr'); // Creates headers row
    let tfootRow = document.createElement('tr'); // Creates footers row

    let footers = false; // boolean value to test if you want footers

    let numColumns = headers.length;

    if (reorder) {
        trClasses.push('tr-drag');
        trAttributes.push({
            attribute: 'data-swap',
            value: () => 'false'
        });
        trAttributes.push({
            attribute: 'draggable',
            value: () => 'true'
        });
        trAttributes.push({
            attribute: 'data-insert',
            value: (row) => false
        });
        if (!reorder.dragPosition || reorder.dragPosition == 'start') {
            headers.unshift({
                title: 'Drag',
                getData: () => {
                    return '<i class="material-icons">drag_indicator</i>';
                },
                classes: [
                    'table-drag',
                    'cursor-grab'
                ]
            });
        } else if (reorder.dragPosition == 'end') {
            headers.push({
                title: 'Drag',
                getData: () => {
                    return '<i class="material-icons">drag_indicator</i>';
                },
                classes: [
                    'table-drag',
                    'cursor-grab'
                ]
            });
        } else if (typeof reorder.dragPosition == 'number') {
            headers.splice(reorder.dragPosition, 0, {
                title: 'Drag',
                getData: () => {
                    return '<i class="material-icons">drag_indicator</i>';
                },
                classes: [
                    'table-drag',
                    'cursor-grab'
                ]
            });
        } else if (reorder.dragPosition = 'row') {
            trClasses.push('table-drag');
            trClasses.push('cursor-drag');
        }
    }

    headers.forEach(h => { // loops through headers
        if (!h) return;
        let th = document.createElement('th'); // Creates header element

        if (evenColumns) th.style.width = (1 / numColumns) * 100 + '%';

        if (typeof h.title == 'string') th.innerHTML = h.title;
        else th.appendChild(h.title);

        if (h.tooltip) {
            th.title = h.tooltip;
            tooltips = true;
        }

        th.classList.add('no-select');

        if (h.footer) { // if you want footers, use this!
            let tf = document.createElement('th'); // Creates header element for footer
            footers = true; // sets footers to true for later to prevent error

            if (evenColumns) th.style.width = (1 / numColumns) * 100 + '%';

            if (typeof h.title == 'string') tf.innerHTML = h.title;
            else tf.appendChild(h.title);

            tf.classList.add('no-select');

            tfootRow.appendChild(tf); // appends footer element into footer row
        }
        theadRow.appendChild(th); // appends header to header row
    });

    thead.appendChild(theadRow); // appends header row to header div
    table.appendChild(thead); // appends header div to table
    if (footers) tfoot.appendChild(tfootRow); // footer row to footer div

    if (!data || data.length == 0) return;
    let rowPos = 0;

    let tbody = document.createElement('tbody'); // initiates data body
    // resets data that passses appendTest (used for reorder)
    data.forEach(d => { // loops through data
        if (!d) return;
        d._rowPos = rowPos;
        try {
            if (appendTest) { // Do you want to have this row?
                if (!appendTest(d)) return;
            }
        } catch (err) {}
        let tr = document.createElement('tr'); // creates new row

        let colPos = 0;

        headers.forEach(h => { // loops through headers
            if (!h) return;
            let td = document.createElement('td'); // creates data element

            if (editing) {
                td.classList.add('table-light');
                td.classList.add('p-0');
                const input = createElementFromSelector('input.form-control.w-100.h-100');
                input.type = 'text';
                input.value = d[h.title];

                input.addEventListener('change', () => {
                    onEdit(d, h.title, input.value);
                });

                td.appendChild(input);
                tr.appendChild(td);
                return;
            }

            let _data = h.getData ? h.getData(d) : '-!@#$%^&*()';
            // console.log(_data);
            if (_data == '-!@#$%^&*()') td.innerHTML = d[h.title];
            else if (typeof _data == 'object' && _data) td.appendChild(_data); // calls header.getData() function to get content for this cell, if it doesn't exist, destructure the object
            else td.innerHTML = _data;

            if (Array.isArray(h.listeners)) h.listeners.forEach(l => { // if you want listeners for this column, sets them (can be several)
                td.addEventListener(l.type, (event) => l.action({ event, data: d, td })); // creates listener from listener.type ('click','mouseover','touchstart',etc.) and action() which passes in data from this row
            });

            td.dataset.colPos = colPos;
            td.dataset.rowPos = rowPos;
            td.dataset.header = h.title;

            // Sets td attributes
            if (Array.isArray(h.attributes)) h.attributes.forEach(att => {
                td.setAttribute(att.attribute, att.value);
            });

            if (Array.isArray(h.classes)) h.classes.forEach(c => {
                td.classList.add(c);
            });

            if (Array.isArray(colGroup)) {
                let colGCol = colGroup.find(c => c.index == colPos);
                if (colGCol) {
                    colGCol.classes.forEach(c => {
                        td.classList.add(c);
                    });
                }
            }

            if (Array.isArray(h.tdClasses)) {
                h.tdClasses.forEach(c => {
                    td.classList.add(c);
                });
            }
            try {
                if (h.tdTooltip) {
                    const tooltip = h.tdTooltip(d, h.title);
                    if (tooltip) {
                        td.title = tooltip;
                        tdTooltip = true;
                    }
                }
            } catch {}

            tr.appendChild(td); // appends data to row

            colPos++;
        });
        if (trListeners) trListeners.forEach(l => { // if you want listeners for the row itself, sets them (can be several)
            tr.addEventListener(l.type, (event) => l.action({ event, data: d, tr, row: d })) // creates listener from listener.type ('click','mouseover','touchstart',etc.) and action() which passes in data from this row
        });
        tr.dataset.rowPos = rowPos; // ads rowPos to tr

        // Adds tr attributes
        if (trAttributes) trAttributes.forEach(att => {
            tr.setAttribute(att.attribute, att.value(d));
        });

        if (trClassTests) {
            trClassTests.forEach(test => {
                if (test.test(d)) tr.classList.add(test.value);
            });
        }
        if (trClasses) {
            trClasses.forEach(c => {
                tr.classList.add(c);
            });
        }

        tbody.appendChild(tr); // appends row to data body
        rowPos++;
        return d;
    });
    table.appendChild(tbody); // appends data body to table
    if (footers) table.appendChild(tfoot); // appends footers to table

    // Makes dataTable
    if (dataTable || datatable) {
        $('#' + table.id).each((_, table) => {
            $(table).DataTable();
        });
    }

    // make bootstrap tooltips
    if (tooltips) {
        // select all th from table
        $('#' + table.id + ' th').tooltip();
    }

    if (tdTooltip) {
        // select all td from table
        $('#' + table.id + ' td').tooltip();
    }

    // make reordered table
    if (reorder) {
        const dragIndex = headers.indexOf(headers.find(h => h.title == 'Drag'));
        headers.splice(dragIndex, 1);
        let {
            onDragStart,
            onDragEnd,
            onDrag,
            onInsert,
            onSwap
        } = reorder;
        // console.log('setting drag events');
        if (!onDragStart) onDragStart = () => {};
        if (!onDragEnd) onDragEnd = () => {};
        if (!onDrag) onDrag = () => {};
        if (!onInsert) onInsert = () => {};
        if (!onSwap) onSwap = () => {};
        let currentDrag;

        let trPositions = [];
        let blankPositions = [];

        table.querySelectorAll('tr').forEach(tr => {

            const placeholderDragOver = (e) => {}

            const placeholderDragEnter = (e) => {
                e.preventDefault();
                e.target.classList.add('table-info');
                tr.dataset.insert = 'true';
            }

            const placeholderDragLeave = (e) => {
                e.preventDefault();
                e.target.classList.remove('table-info');
                tr.dataset.insert = 'false';
            }

            tr.addEventListener('dragstart', (e) => {
                // e.preventDefault();
                tr.classList.add('cursor-grabbing');

                const tds = e.target.querySelectorAll('td');

                let allowed = false;
                tds.map(td => {
                    // if the mouse is over a td that has a class of 'table-drag', then allow the drag
                    // get mouse positions
                    const { x, y } = e;
                    const { left, top, bottom, right } = td.getBoundingClientRect();
                    if (x > left && x < right && y > top && y < bottom) {
                        if (td.classList.contains('table-drag')) allowed = true;
                    }

                    // else return;
                });

                if (!allowed) {
                    e.preventDefault();
                    return;
                }

                currentDrag = tr.dataset.rowPos;

                const { left, right, top, bottom } = tr.getBoundingClientRect();
                tr.style.position = 'fixed';
                tr.style.top = top + 'px';
                tr.style.left = left + 'px';
                tr.style.width = right - left + 'px';
                tr.style.height = bottom - top + 'px';
                // tr.classList.add('invisible');

                tds.forEach(td => {
                    td.style.width = td.clientWidth + 'px';
                    td.style.height = td.clientHeight + 'px';
                    // const { left, right, top, bottom } = td.getBoundingClientRect();

                    // td.style.position = 'fixed';
                    // td.style.top = top + 'px';
                    // td.style.left = left + 'px';
                    // td.style.width = right - left + 'px';
                    // td.style.height = bottom - top + 'px';
                });

                trPositions = [];
                blankPositions = [];

                // insert a blank placeholder row between each row
                table.querySelector('tbody').querySelectorAll('tr').forEach(_tr => {

                    const blank = document.createElement('div');
                    blank.classList.add('table-insert-blank');
                    blank.style.height = '20px';

                    blank.addEventListener('dragover', placeholderDragOver);
                    blank.addEventListener('dragenter', placeholderDragEnter);
                    blank.addEventListener('dragleave', placeholderDragLeave);
                    blank.addEventListener('drop', placeholderDragLeave);
                    blank.dataset.insertPos = _tr.dataset.rowPos;
                    blank.setAttribute('colspan', headers.length);

                    table.querySelector('tbody').insertBefore(blank, _tr);


                    const {
                        left,
                        right,
                        top,
                        bottom
                    } = _tr.getBoundingClientRect();
                    trPositions.push({
                        left,
                        right,
                        top,
                        bottom
                    });

                    const {
                        left: _left,
                        right: _right,
                        top: _top,
                        bottom: _bottom
                    } = blank.getBoundingClientRect();

                    blankPositions.push({
                        left: _left,
                        right: _right,
                        top: _top,
                        bottom: _bottom
                    });
                });

                const blank = document.createElement('div');
                // blank.classList.add('w-100');
                // blank.classList.add('bg-fade-fast');
                blank.classList.add('table-insert-blank');
                blank.style.height = '20px';
                blank.dataset.insertPos = trPositions.length;
                blank.setAttribute('colspan', headers.length);

                blank.addEventListener('dragover', placeholderDragOver);
                blank.addEventListener('dragenter', placeholderDragEnter);
                blank.addEventListener('dragleave', placeholderDragLeave);
                blank.addEventListener('drop', placeholderDragLeave);
                blank.dataset.insertPos = data.length;
                blank.setAttribute('colspan', headers.length);

                table.querySelector('tbody').appendChild(blank);

                const {
                    left: _left,
                    right: _right,
                    top: _top,
                    bottom: _bottom
                } = blank.getBoundingClientRect();

                blankPositions.push({
                    left: _left,
                    right: _right,
                    top: _top,
                    bottom: _bottom
                });

                // console.log(trPositions);
                // console.log(blankPositions);

                const { x, y } = e;
                tr.dataset.startX = x;
                tr.dataset.startY = y;

                onDragStart();
            });

            tr.addEventListener('drag', (e) => {
                // e.preventDefault();
                const { x, y, clientX, clientY } = e;

                let newY = y - (+tr.dataset.startY || y) + 'px';
                let newX = x - (+tr.dataset.startX || x) + 'px';

                tr.style.transform = 'translate(' + newX + ', ' + newY + ')';

                blankPositions.forEach((pos, i) => {
                    const { left: blLeft, right: blRight, top: blTop, bottom: blBottom } = pos;
                    try {
                        const { left: trLeft, right: trRight, top: trTop, bottom: trBottom } = trPositions[i];
                        if (clientY > trTop && clientY < trBottom && clientX > trLeft && clientX < trRight) {
                            if (i == currentDrag) return;
                            // console.log('dragged into tr: ', i);
                            tr.dataset.swap = i;
                            tr.dataset.insert = null;

                            table.querySelectorAll('tr').forEach(_tr => {
                                tr.classList.remove('bg-info');
                                tr.classList.remove('bg-fade-fast');
                            });

                            table.querySelectorAll('div').forEach(_div => {
                                _div.classList.remove('bg-secondary');
                                _div.classList.remove('bg-fade-fast');
                            });

                            table.querySelector('tr[data-row-pos="' + i + '"]').classList.add('bg-fade-fast');
                            table.querySelector('tr[data-row-pos="' + i + '"]').classList.add('bg-info');
                            return;
                        }
                    } catch {}
                    if (clientY > blTop && clientY < blBottom && clientX > blLeft && clientX < blRight) {
                        // console.log('dragged into blank: ', i);
                        tr.dataset.insert = i;
                        tr.dataset.swap = null;

                        table.querySelectorAll('tr').forEach(_tr => {
                            tr.classList.remove('bg-fade-fast');
                            tr.classList.remove('bg-info');
                        });

                        table.querySelectorAll('div').forEach(_div => {
                            _div.classList.remove('bg-fade-fast');
                            _div.classList.remove('bg-secondary');
                        });
                        table.querySelector('div[data-insert-pos="' + i + '"]').classList.add('bg-fade-fast');
                        table.querySelector('div[data-insert-pos="' + i + '"]').classList.add('bg-secondary');
                        return;
                    }
                    // else {
                    // tr.dataset.swap = null;
                    // tr.dataset.insert = null;
                    try {
                        table.querySelector('tr[data-row-pos="' + i + '"]').classList.remove('bg-info');
                        table.querySelector('tr[data-row-pos="' + i + '"]').classList.remove('bg-fade-fast');
                    } catch {}
                    table.querySelector('div[data-insert-pos="' + i + '"]').classList.remove('bg-fade-fast');
                    table.querySelector('div[data-insert-pos="' + i + '"]').classList.remove('bg-secondary');
                    // }
                });
                onDrag();
                // console.log(tr.dataset.swap, tr.dataset.insert);
            });

            tr.addEventListener('dragend', (e) => {
                // e.preventDefault();
                // document.body.style.cursor = 'auto';
                tr.classList.remove('cursor-grabbing');
                onDragEnd();

                const { clientX, clientY } = e;
                const { left, right, top, bottom } = table.getBoundingClientRect();

                if (!(clientY > top && clientY < bottom && clientX > left && clientX < right)) {
                    tr.dataset.swap = null;
                    tr.dataset.insert = null;
                }

                let { swap, insert } = tr.dataset;
                tr.style.transform = '';
                tr.style.position = '';
                tr.style.top = '';
                tr.style.left = '';
                tr.style.width = '';
                tr.style.height = '';

                table.querySelectorAll('div.table-insert-blank').forEach(_div => _div.remove());
                if (swap != 'null') {
                    swap = +swap;
                    // swap rows in data

                    const swapRow = data[swap];
                    data[swap] = data[currentDrag];
                    data[currentDrag] = swapRow;
                    setTable(table, headers, data, options);
                    onSwap(data);
                    return;
                }

                if (insert != 'null') {
                    insert = +insert;
                    const insertRow = data[currentDrag];

                    const currentIndex = data.indexOf(insertRow);

                    // delete row from data
                    data.splice(currentDrag, 1);

                    // insert row into data
                    if (insert > currentIndex) data.splice(insert - 1, 0, insertRow);
                    else data.splice(insert - 2, 0, insertRow);

                    setTable(table, headers, data, options);
                    onInsert(data);
                    return;
                }
            });
        });

    }
}


function placeHolderDrop(e, table, tr) {
    e.preventDefault();
    const { insert } = tr.dataset;
    if (insert == 'true') {
        // insert the row before the placeholder row
        // e.target is the placeholder row
        e.target.parentNode.insertBefore(tr, e.target);
        table.querySelectorAll('.table-placeholder').forEach(placeholder => placeholder.remove());
        resetDrag(tr);
    }
}

function tableToObject(table, headers, options) {
    let invert;
    if (options) {
        invert = options.invert;
    }
    let data = [];
    try {
        if (invert) {
            headers.forEach((h, i) => {
                if (i == 0) return;
                let output = {
                    column: h.variableName ? h.variableName : h.title,
                    data: []
                };
                table.querySelectorAll(`tbody td[data-col-pos="${i}"]`).forEach((col, row) => {
                    let rowData = {}
                    let rowDataTitle = headers[0].getData(table.querySelector(`tbody td[data-col-pos="0"][data-row-pos="${row}"]`));
                    rowData[rowDataTitle] = h.getData(col);
                    output.data.push(rowData);
                });
                data.push(output);
            });
        } else {
            table.querySelectorAll('tbody tr').forEach(tr => {
                let output = {};
                headers.forEach(h => {
                    let td = tr.querySelector(`td[data-header="${h.title}"]`);

                    let variableName = h.variableName ? h.variableName : h.title;

                    output[variableName] = h.getData(td);
                });
                data.push(output);
            });
        }


        return data;
    } catch (err) {
        return [];
    }
}