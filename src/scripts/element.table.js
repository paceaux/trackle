/**
 * @description a custom element that displays a table
 */
export default class TrackerTable extends HTMLElement {
    /**
     * @description the column names
     * @private
     * @type {string}
     */
    #rawColumns = '';

    /**
     * @description the row data
     * @private
     * @type {Array<object>}
     */
    #rowData = [];

    /**
     * @description attributes that would trigger a rerender
     * @type {Array<string>}
     */
    static observedAttributes = ['rowdata', 'columns', 'type'];

    /**
     *
     * @param {string} time a string with the format 'YYYY-MM-DD'
     * @returns {Array<string>} an array with the date parts
     */
    static getTime(time) {
        return time.split('-');
    }

    /**
     * @description the name of the cell in a row that is the header
     * @param  {string} ['date'] - either 'date' or whateveer's in the attribute 'rowheader'
     */
    rowHeaderName = this.getAttribute('rowheader') || 'date';

    // this is the standard constructor for custom elements
    // eslint-disable-next-line no-useless-constructor
    constructor() {
        super();
    }

    /**
     * @description the type of data in the table (this corresponds to the store in IndexedDB)
     * @type {string} whatever is in the attribute 'type'
     */
    get type() {
        return this.getAttribute('type');
    }

    set type(val) {
        this.setAttribute('type', val);
        this.renderBody();
    }

    /**
     * @description the data to be displayed in the table
     * @type {Array<object>} the data to be displayed in the table
     */
    get tableData() {
        return this.#rowData;
    }

    set tableData(val) {
        this.#rowData = val;
        this.renderBody(val);
    }

    /**
     * @description the columns to be displayed in the table
     * @type {Array<string>} the columns to be displayed in the table
     */
    get columns() {
        const cols = this.#rawColumns;
        let columns = cols;
        if (!Array.isArray(cols)) {
            columns = cols.split(',').map(column => column.trim());
        }
        return columns;
    }

    set columns(val) {
        this.#rawColumns = val;
        this.renderBody();
    }

    /**
     * @description the table element in the custom element
     * @type {HTMLTableElement} the table element in the custom element
     */
    get table() {
        return this.querySelector('table');
    }

    /**
     * @description the table body element in the custom element
     * @type {HTMLTableSectionElement} the table body element in the custom element
     */
    get tbody() {
        const tbody = this.table.querySelector('tbody') || this.table.createTBody();
        return tbody;
    }

    /**
     * @description the thead element in the custom element
     * @type {HTMLTableSectionElement} the thead element in the custom element
     */
    get thead() {
        const thead = this.table.querySelector('thead') || this.table.createTHead();
        return thead;
    }

    /**
     * @description the thead element in the custom element
     * @type {HTMLTableSectionElement} the thead element in the custom element
     */
    get tfoot() {
        const tfoot = this.table.querySelector('tfoot') || this.table.createTFoot();
        return tfoot;
    }

    /**
     * @description sorts data by a keyname
     * @param {Array<object>} data the data to be sorted
     * @param {string} [key = 'date'] the key name to sort the data by
     * @returns {Array<object>} sorted data
     */
    static sortData(data, key = 'date') {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        if (!key) {
            return data;
        }

        const dateSortedResult = data.sort((a, b) => {
            const [aDay, aMonth, aYear] = TrackerTable.getTime(a[key]);
            const [bDay, bMonth, bYear] = TrackerTable.getTime(b[key]);
            const aDate = new Date(aYear, aMonth - 1, aDay);
            const bDate = new Date(bYear, bMonth - 1, bDay);
            return aDate - bDate;
        });
        const otherSortedResult = data.sort((a, b) => {
            if (a[key] < b[key]) {
                return -1;
            }
            if (a[key] > b[key]) {
                return 1;
            }
            return 0;
        });

        const sortedResult = key === 'date' ? dateSortedResult : otherSortedResult;

        return sortedResult;
    }

    /**
     * @description gets a time element based on a string
     * @param  {string} time - a string with the format 'YYYY-MM-DD'
     * @returns {HTMLTimeElement} a time element
     */
    static getTimeElement(time) {
        if (!time) {
            throw new Error('time is required');
        }
        const [day, month, year] = TrackerTable.getTime(time);
        const timeEl = document.createElement('time');
        const date = new Date(year, month - 1, day);
        timeEl.setAttribute('datetime', `${year}-${month}-${day}`);
        const formattedTime = new Intl.DateTimeFormat().format(date);
        timeEl.textContent = formattedTime;

        return timeEl;
    }

    /**
     * @description renders a cell in a row. It could be a td or a th based on isRowHeader
     * @param  {string} key the property/keyname of the data
     * @param  {*} value the data to be displayed
     * @param  {HTMLTableRowElement} row
     * @param  {boolean} [isRowHeader=key === this.rowHeaderName] whether the cell is the row header
     */
    renderCell(key, value, row, isRowHeader = (key === this.rowHeaderName)) {
        if (!row) {
            return;
        }
        const cellHeader = `${this.type}-${row.dataset.date}`;
        const cell = isRowHeader
            ? document.createElement('th')
            : row.insertCell();
        cell.setAttribute('data-key', key);
        cell.headers = `${this.type}-${key}`;

        if (isRowHeader) {
            const [day, month, year] = TrackerTable.getTime(value);
            const timeEl = TrackerTable.getTimeElement(value);
            cell.appendChild(timeEl);
            cell.setAttribute('id', cellHeader);
            cell.setAttribute('data-day', day);
            cell.setAttribute('data-month', month);
            cell.setAttribute('data-year', year);
            row.appendChild(cell);
        } else {
            cell.textContent = value;
            cell.setAttribute('headers', `${cellHeader} ${cell.headers}`);
        }
    }

    /**
     * @param  {HTMLTableRowElement} existingRow the row to add the edit button to
     * @param  {Object} rowDatum the data for the row that would need to be edited
     */
    renderEditCell(existingRow, rowDatum) {
        const editCell = existingRow.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            const editForm = document.querySelector('.js-health-tracker');
            if (editForm) {
                const keys = Object.keys(rowDatum);
                keys.forEach(key => {
                    let input = editForm.querySelector(`[name="${this.type}-${key}"]`);
                    const isDate = key === 'date';

                    if (isDate) {
                        input = editForm.querySelector('[name="meta-date"]');
                        const [d, m, y] = TrackerTable.getTime(rowDatum[key]);
                        input.value = `${y}-${m}-${d}`;
                    } else {
                        input.value = rowDatum[key];
                    }
                });

                editForm.scrollIntoView();
                editForm.querySelector('[name="isEditing"').value = 'true';
            }
        });
        editCell.appendChild(editButton);
    }

    /**
     * @description renders the header of the table and adds ids to the cells
     * @param  {Array<string>} [columns=this.columns] the columns to be displayed in the table
     */
    renderTHead(columns = this.columns) {
        const { thead } = this;
        const headerRow = thead.insertRow();
        columns.forEach(column => {
            const headerCell = document.createElement('th');
            headerCell.textContent = column;
            headerCell.setAttribute('id', `${this.type}-${column}`);
            headerRow.appendChild(headerCell);
        });
    }

    /**
     * @description renders the footer of the table and adds ids to the cells
     * @param  {Array<string>} [columns=this.columns] the columns to be displayed in the table
     */
    renderTFoot(columns = this.columns) {
        const thead = this.tfoot;
        const headerRow = thead.insertRow();
        columns.forEach(column => {
            const headerCell = document.createElement('th');
            headerCell.textContent = column;
            headerRow.appendChild(headerCell);
        });
    }

    /**
     * @description renders the body of the table
     * @param  {Array<object>} rowData=this.tableData
     * @param  {string} sortKey='date'
     */
    renderBody(rowData = this.tableData, sortKey = 'date') {
        if (!rowData) {
            return;
        }
        const { tbody } = this;
        const sortedrowData = TrackerTable.sortData(rowData, sortKey);
        tbody.innerHTML = '';
        sortedrowData.forEach(rowDatum => {
            const existingRow = tbody.insertRow();
            existingRow.setAttribute('data-date', rowDatum.date);

            this.columns.forEach(column => {
                this.renderCell(column, rowDatum[column], existingRow);
            });

            this.renderEditCell(existingRow, rowDatum);
        });
    }

    /**
     * @description handles changes to the attributes of the custom element
     */
    connectedCallback() {
        this.renderBody();
    }

    /**
     * @description handles changes to the attributes of the custom element
     * @param  {string} name name of the attribute
     * @param  {string} oldValue previous value
     * @param  {string} newValue new value
     */
    attributeChangedCallback(name, oldValue, newValue) {
        const isValidName = TrackerTable.observedAttributes.includes(name);
        if (isValidName && oldValue !== newValue) {
            this[name] = newValue;
            this.renderBody();
        }
    }
}
