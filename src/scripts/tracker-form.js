/**
 * @description A class to handle the form for the health tracker
 * @class TrackerForm
 * @property  {HTMLFormElement} form - The form element
 * @property  {TrackerStorage} storage - The storage instance to use
 * @property  {string} namespaceSeparator - separates the namespace from key in the namespace
 */
export default class TrackerForm {
    /**
     * @description The thing that separates the namespace from the key within the namespace
     */
    static namespaceSeparator = '-';

    /**
     * @param  {TrackerStorage} storage - The storage instance to use
     * @param  {string} [formSelector='.js-health-tracker'] - The selector for the form element
     * @param  {string} [namespaceSeparator=TrackerForm.namespaceSeparator]
     */
    constructor(storage, formSelector = '.js-health-tracker', namespaceSeparator = TrackerForm.namespaceSeparator) {
        this.form = document.querySelector(formSelector);
        this.storage = storage;
        this.namespaceSeparator = namespaceSeparator;
    }

    /**
     * @description The form data as a FormData object
     * @returns {FormData}
     */
    get formData() {
        if (!this.form) {
            return new FormData();
        }
        return new FormData(this.form);
    }

    /**
     * @description The form data as an object
     * @longdescription The form data is transformed to nested objects based on the name attribute
     *  where the name attribute is hyphenated and the first part is the namespace
     *  and the second part is the key
     *  e.g. <input name="health-bmi" /> becomes { health: { bmi: value } }
     * @returns {Object}
     */
    get trackerData() {
        const { formData } = this;
        const keys = [...formData.keys()];
        const data = {};

        keys.forEach(key => {
            const [namespace, keyName] = key.split(this.namespaceSeparator);
            if (!data[namespace] && keyName) {
                data[namespace] = {};
            }
            let value = formData.get(key);
            const isDate = keyName === 'date';
            if (isDate) {
                const [year, month, day] = value.split('-');
                value = `${day}-${month}-${year}`;
            }
            if (keyName) {
                data[namespace][keyName] = value;
            }

            if (namespace && !keyName) {
                data[namespace] = value;
            }
        });

        return data;
    }

    /**
     * @description The submit handler for the form (expect to override it)
     * @param  {Event} event
     */
    async handleSubmit(event) {
        event.preventDefault();
        try {
            const healthData = { ...this.trackerData.health, date: this.trackerData.meta.date };
            await this.storage.saveData(healthData, 'health');
            await this.storage.getAllData('health');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    /**
     * @description The reset handler for the form (expect to override it)
     * @param  {Event} event
     */
    // eslint-disable-next-line class-methods-use-this
    handleReset(event) {
        // eslint-disable-next-line no-console
        console.log('resetting form', event);
    }

    /**
     * @description Resets the form
     * @returns {void}
    */
    resetForm() {
        this.form.reset();
    }

    /**
     * @description binds events in the form
     * @returns {void}
    */
    bindEvents() {
        this.form.addEventListener('submit', async (event) => this.handleSubmit(event));
        this.form.addEventListener('reset', (event) => { this.handleReset(event); });
        this.form.querySelectorAll('.fields__title').forEach((fieldTitle) => {
            fieldTitle.addEventListener('click', (event) => {
                const field = event.target;
                const parent = field.parentElement;
                parent.classList.toggle('fields--isCollapsed');
            });
        });
    }

    /**
     * @description Initializes the form (binds events and whatever else)
     * @returns {void}
    */
    init() {
        this.bindEvents();
    }
}
