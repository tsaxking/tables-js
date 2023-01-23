# tables.js Version 1.1.*

## Installation

```html
<script src="https://cdn.jsdelivr.net/npm/tables-js/1.1/tables.js"></script>
```
It is recommended that tables.js be used with [Bootstrap](https://getbootstrap.com/), [jQuery](https://jquery.com/), [jQuery Datatables](https://datatables.net/), and [Material Icons](https://material.io/resources/icons/?style=baseline), but it is not required. If you want to use tables.js with Bootstrap, jQuery, and jQuery Datatables, you can use the following code:
```html
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.2.1/css/bootstrap.min.css">
<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
<script src="https://cdn.datatables.net/1.10.24/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.10.24/js/dataTables.bootstrap4.min.js"></script>  
<script src="https://cdn.jsdelivr.net/npm/js-tables/1.1/tables.js"></script>
```

## Usage

Initialize the table with the following code:

```javascript
const table = document.getElementById("my-table");
const headers = ["Name", "Age", "Favorite Color"]; // these can be objects as well
const data = [
    {
        Name: "John",
        Age: 20,
        "Favorite Color": "Blue"
    },
    {
        Name: "Jane",
        Age: 21,
        "Favorite Color": "Red"
    }
];
const options = { // optional
    // options go here
};

const myTable = new Table(table, headers, data, options);
```

## Custom Table Classes
### Table
```javascript
class Table {
    /* properties */
    el // the table element
    headers // the headers
    data // the data
    originalData // data before any filters/sorting/inserting/deleting
    options // the options
    states // the Table_StateStack object
    rows // the array of TableRow objects
    tableHeaders // the array of TableHeader objects
    columns // the array of TableColumn objects

    /* public methods */
    render() // renders the table
    destroy(deleteData: Booean) // destroys the table (deleteData removes all data from the Table object)
    
    /* private methods */
    showInsertRows(TableRow) // shows the insert rows above and below the TableRow (used with reorderable tables)
    hideInsertRows() // hides the insert rows
    renderRows() // renders the rows
    renderHeaders() // renders the headers
    sort() // used with sortable tables
    update() // updates the table
    renderFromContent() // renders the table from the content of the Table object (for use with editable tables)

    /* getters */
    get content() // returns the array of TableRow.content objects
    get json() // returns JSON.stringify(this.content)
}
```
### Table_StateStack
This class is an extension of [js-state-stack](https://npmjs.org/package/js-state-stack) and is used to keep track of the table's/cell's state. It is used to keep track of the table's state when editing, sorting, etc. It is not recommended to use this class directly.
### TableRow
```javascript
class TableRow {
    /* properties */
    cells // the array of TableCell objects
    el // the tr element
    data // the data passed into header.getData()

    /* private methods */
    render() // renders the row

    /* getters */
    get content() // returns an object of {headerTitle: tableCell.content}
}
```
### TableHeader
```javascript
class TableHeader {
    /* properties */
    el // the th element
    options // the options (currently unused)

    /* public methods */
    changeContent(content) // changes the content of the header and rerenders the <td> element

    /* private methods */
    render() // renders the header
}
```
### TableFooter
An extension of `TableHeader` that is used with the `footer` option. This has all the same properties and methods as `TableHeader`.
### TableColumn
```javascript
class TableColumn {
    /* properties */
    cells // the array of TableCell objects (includes the header cell)
    header // the TableHeader object

    /* getters */
    get content() // returns an array of the content of each cell in the column (includes the header cell)
}
```
### TableCell
```javascript
class TableCell {
    /* properties */
    el // the td or th element
    colPos // the column position
    rowPos // the row position
    headerTitle // the header title
    header // the TableHeader object
    editable // the editable object in Table.options
    stack // the Table_StateStack object
    
    /* public methods */
    onChange() // custom function that is called when the cell is changed (used with editable tables)
    onCancel() // custom function that is called when the cell is cancelled (used with editable tables)
    changeContent(content) // changes the content of the cell and rerenders the <td> element

    /* private methods */
    render() // renders the cell
}
```
### ReorderInsertRow
This is only used with reorderable tables. These are the rows that hare hidden and shown when you drag over a row. They are used to insert a row above or below the row you are dragging over.
```javascript
class ReorderInsertRow {
    el // the tr element
    row // the TableRow object that the insert row is above or below

    /* private methods */
    show() // shows the insert row
    hide() // hides the insert row
}
```
## Parameters

### The Table Element
All you need to do is pass in the table element you want to use. This can be done in two ways:

```javascript
const myTable = new Table(document.getElementById("my-table"));
```
or 
```javascript
const myTable = new Table("#my-table"); // you can use any selector you wish :)
```

### Headers
The headers parameter is either an object where each key is the header name, or an array of objects or strings that generate each header and subsequent column. If you pass in an array of strings, the headers will be generated with the string as the header text and the data will be generated by row[headerTitle]. If you pass in an array of objects, you must specify the following properties:
- `header.title || header.name || header.key` which will be the string that the `<th>` is populated with
- `header.getData` this must be a function that returns either a string to populate inside of the `<td>` element using `td.innerHTML`, or an element to populate inside of the `<td>` using `td.appendChild()`. If no `header.getData` is specified, it will return `row[header.title || header.name || header.key]`.

All of these examples will make this in HTML:
```html
<table>
    <thead>
        <tr>
            <th>Name</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John</th>
        </tr>
    </tbody>
</table>
```
Object Array Header Example:
```javascript
const headers = [{
    title: 'Name',
    getData: (row) => {
        return row.name;
    }
}];

const data = [{
    name: 'John'
}];

const myTable = new Table("#my-table", headers, data);
```
String Array Header Example:
```javascript
const headers = ['Name'];

const data = [{
    Name: 'John' // notice how this must be the same capitalization as the header
}];

const myTable = new Table("#my-table", headers, data);
```
Object Header Example:
```javascript
const headers = {
    Name: {
        getData: (row) => {
            return row.name;
        }
    }
};

const data = [{
    Name: 'John' // again, the case must be the same as above.
}];

const myTable = new Table("#my-table", headers, data);
```

The other properties of the header objects are used to customize the columns.
All the properties below are written as `header.property`. These properties are the same whether you pass in an array of objects or an object.

#### Changing the `<td>` Elements
##### Classes
`header.classes` is an array of strings that will be added to the `<td>` element.
`header.tdClasses` is an array of strings that will be added to each `<td>` element in this column.
`header.tdClassTests` is an array of objects that will be used to add classes to the `<td>` element. Each object must have the following properties:
- `test` is a function that returns a boolean. If the function returns true, the class will be added to the `<td>` element.
- `class` (OPTIONAL) is a string that will be added to the `<td>` element if the `test` function returns true.
- `classes` (OPTIONAL) is an array of strings that will be added to the `<td>` element if the `test` function returns true.

Example:
```javascript
const headers = [{
    title: 'Name',
    classes: ['my-class', 'my-other-class'], // applies to <th>
    tdClasses: ['my-td-class', 'my-other'], // applies to <td>
    tdClassTests: [{
        test: (row) => {
            return row.name === 'John';
        },
        class: 'my-class' // applies to <td>
    }, {
        test: (row) => {
            return row.name === 'John';
        },
        classes: ['my-class', 'my-other-class'] // applies to <td>
    }]
}];
```

##### Attributes
`header.attributes` is an array of objects that will be added to the `<td>` element. Each object must have the following properties:
- `name` is a string that will be the name of the attribute.
- `value` is a either a string that is the value of the attribute, or a function that returns a string that is the value of the attribute that passes in the row as a parameter.

Example:
```javascript
const headers = [{
    title: 'Name',
    attributes: [{
        name: 'data-name',
        value: 'John'
    }, {
        name: 'data-name',
        value: (row) => { // row is a TableRow object
            return row.name;
        }
    }]
}];
```

##### Event Listeners
All lisener arrays are structured the same way. Each object must have the following properties:
- `type` is a string that is the name of the event.
- `callback` (v1.1.*) is a function that is the listener that passes in the event as a parameter. (Uses a different data structure than v1.0.*)
- `action` (v1.0.*) is a function that is the listener that passes in the event as a parameter.

`header.thListeners` is an array of objects that will be added to the `<th>` element.
`header.tdListeners` is an array of objects that will be added to each `<td>` element in this column.

Example:
```javascript
const headers = [{
    title: 'Name',
    thListeners: [{
        event: 'click', // runs when the `<th>` is clicked
        callback: (event) => { // v1.1.*
            /* 
                event is an event object with the following expanded property:
                - event.__row = TableRow object
            */
            console.log(event);
        }
    }],
    tdListeners: [{
        event: 'click',
        action: ({
            event, // event object
            row, // data row (custom data)
            tableRow // TableRow object
        }) => { // v1.0.*
            console.log(event);
        }
    }]
}];
```

##### Sorting
`header.sort` is a sorting function that runs when the header is clicked. It sorts through the data and rerenders the table. This does not change `table.originalData`, only `table.data`. Currently, if you click it once, it sorts up, click again, it sorts down, and click again, it sorts back to the original order. This will be changed in the future to allow for more customization.

Example:
```javascript
const headers = [{
    title: 'Name',
    sort: (a, b) => { // a and b are TableRow objects
        return a.data.name > b.data.name;
    }
}];
```

`<td>` Editing (to be used with `options.editable`)
`header.editable` is a boolean that determines if the `<td>` element is editable. If true, each `<td>` element will have a contenteditable attribute.

```javascript
const headers = [{
    title: 'Name',
    editable: true
}, {
    title: 'Age',
    editable: false
}];

const data = [{
    Name: 'John'
}];

const options = {
    editable: true
};
```
Will create
```html
<table>
    <thead>
        <tr>
            <th>Name</th>
        </tr>
        <tr>
            <th>Age</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td contenteditable="true">John</td>
        </tr>
        <tr>
            <td>John</td>
        </tr>
    </tbody>
</table>
```
**Note:** Even if a user edits the html, it will not change `TableCell.content`

#### Changing the `<th>` Elements
##### Minimize
`header.minimize` is a boolean that determines if the `<th>` element is minimized. If true, the `<th>` element will have a `minimize` class.

```javascript
const headers = [{
    title: 'Name',
    minimize: true
}, {
    title: 'Age',
    minimize: false
}];
```
Will create
```html
<table>
    <thead>
        <tr>
            <th>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>Name</div>
                    <!-- This icon can change with options.minimize.open -->
                    <i class="material-icons">chevron_left</i>
                </div>
            </th>
        </tr>
        <tr>
            <th>Age</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John</td>
        </tr>
        <tr>
            <td>John</td>
        </tr>
    </tbody>
</table>
```

## Data
The header array is used to represent each row in the table. This is fully customizable because nothing from the `Table` class reads this data, only your `getData` does and other custom functions.

Each row's data will be in `TableRow.data`.

## Options
### `<tr>` Event Listeners
`options.trListeners` is the same as `header.thListeners` and `header.tdListeners` except it applies to all `<tr>` elements.
### Attributes
`options.attributes` is the same as `header.attributes` except it applies to all `<tr>` elements.
### Classes
`options.classes` is the same as `header.classes` except it applies to all `<tr>` elements.
`options.classTests` is the same as `header.classTests` except it applies to all `<tr>` elements.
### Jquery DataTable
`options.datatable = true` or `options.dataTable = true` will create a Jquery DataTable. This will override all other options except `options.editable`.
### Header Sorting
`header.sortable` will make every `<th>` element sortable. This will not override `header.sort`. The sort function will be the same as the default header sort function (`(a, b) => a.el.innerText.localCompare(b.el.innerText);`).
### Even Columns
`options.evenColumns = true` will set the width to be the same for every column using percentages.
### Minimize
`minimize.open` is the icon that will be used for the minimize button. The default is `<i class="material-icons">chevron_left</i>`.
`minimize.minimized` is a boolean that determines if the table is minimized. The default is `false`.

### Options soon to be implemented
- Reorder: Drag and drop to reorder rows and columns. Currently working on this, you can try it out by setting `options.reorder = true` to see what is happening. If you have tips please let me know.
- Search: Search through the table using fuzzy search
- Pagination: Different pagination options for the table (ex. using dots, arrows, select, etc.)
- Caption: Add a caption to the table
- Insertion: Insert a row or column
- Deletion: Delete a row or column

## Generating from Various Data Types
### JSON
```javascript
const myTable = Table.from(table, json, options, 'json'); // 'json' may not be necessary.
// or
const myTable = Table.fromJSON(table, json, options);
```
### CSV
```javascript
const myTable = Table.from(table, csv, options, 'csv'); // 'csv' may not be necessary. 
// or
const myTable = Table.fromCSV(table, csv, options);
```
### TSV
```javascript
const myTable = Table.from(table, tsv, options, 'tsv'); // 'tsv' may not be necessary.
// or
const myTable = Table.fromTSV(table, tsv, options);
```
### HTML
```javascript
const myTable = Table.from(table /* already populated table */, null /* Data is in the prerendered table */, options, 'html'); // 'html' may not be necessary.
// or
const myTable = Table.fromHTML(table, options);
```
