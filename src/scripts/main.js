import TrackerForm from './tracker-form';
import TrackerStorage from './tracker-storage';
import TrackerTable from './element.table';

// Define the custom element
// is there a smoother way to do this?
customElements.define('tracker-table', TrackerTable);

// 1. Create the Storage instance
const trackerStorage = new TrackerStorage();

// 2. Create the TrackerForm instance and send it the storage instance
const trackerForm = new TrackerForm(trackerStorage, '.js-health-tracker');

// 3. Let's create a function that updates stuff
/**
 * @description Updates a given html table based on what's in Storage
 * @param  {} dataType='health'
 * @param  {} storage=trackerStorage
 */
async function updateTable(dataType = 'health', storage = trackerStorage) {
    if (!storage) {
        return;
    }
    try {
        const trackerTable = document.querySelector(`[data-table="${dataType}"]`);
        if (!trackerTable) {
            return;
        }
        const data = await storage.getTableData(dataType);
        if (!data) {
            return;
        }
        trackerTable.tableData = data;
    } catch (err) {
        console.error(err);
    }
}

// 4. we'll override the submit handler with our own.
// why? IDK. Maybe this should all be put in the TrackerForm class?
// but if we did, then we'd have to make assumptions about the data,
// and the goal is to kinda keep the trackerForm somewhat agnostic about the data
trackerForm.handleSubmit = async function handleSubmit(event) {
    event.preventDefault();

    // 4.1 First, get the data out of the form.
    // We add the date to the data because that's the key for each of the elements
    // maybe the form itself should add the key?
    const healthData = { ...this.trackerData.health, date: this.trackerData.meta.date };
    const activityData = { ...this.trackerData.activities, date: this.trackerData.meta.date };
    const consumptionData = { ...this.trackerData.consumption, date: this.trackerData.meta.date };

    // 4.2 Next, either save or update
    // so, _if_ someone clicked an edit button in the table,
    // then a value in the form got set so the form knows it's being edited
    if (this.trackerData.isEditing) {
        await this.storage.updateData(healthData, 'health');
        await this.storage.updateData(activityData, 'activities');
        await this.storage.updateData(consumptionData, 'consumption');
    } else {
        await this.storage.saveData(healthData, 'health');
        await this.storage.saveData(activityData, 'activities');
        await this.storage.saveData(consumptionData, 'consumption');
    }

    // 4.3 finally, update the tables
    // this feels clunky.
    // I feel like each table should somehow be able to attach to data or the db,
    // and update automagically
    await updateTable('health', this.storage);
    await updateTable('activities', this.storage);
    await updateTable('consumption', this.storage);
};

// 5. Let's add a listener to the window to initialize the form and update the tables
window.addEventListener('load', async () => {
    trackerForm.init();
    await updateTable('health', trackerStorage);
    await updateTable('activities', trackerStorage);
    await updateTable('consumption', trackerStorage);
});
