import { LightningElement, track, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllAssignments from '@salesforce/apex/PsaCalendarService.fetchAllAssignments';

export default class PsaCalendar extends LightningElement {
    @api projectName;
    @track assignments = [];
    @track allEvents = [];
    @track selectedEvent;
    @track createRecord = false;

    // Filters
    @track selectedResourceId = null;
    @track selectedRegionId = null;
    @track selectedPracticeId = null;
    @track selectedGroupId = null;

    resourceFilter = {
        criteria: [
            { fieldPath: 'pse__Is_Resource__c', operator: 'eq', value: true },
            { fieldPath: 'pse__External_Resource__c', operator: 'eq', value: false }
        ]
    };

    displayInfoResource = {
        primaryField: 'Name',
        additionalFields: ['Email']
    };

    fullCalendarJsInitialised = false;

    renderedCallback() {
        if (this.fullCalendarJsInitialised) {
            return;
        }
        this.fullCalendarJsInitialised = true;

        Promise.all([
            loadScript(this, FullCalendarJS + '/jquery.min.js'),
            loadScript(this, FullCalendarJS + '/moment.min.js'),
            loadScript(this, FullCalendarJS + '/fullcalendar.min.js'),
            loadStyle(this, FullCalendarJS + '/fullcalendar.min.css')
        ])
            .then(() => {
                this.fetchAssignments();
            })
            .catch(error => {
                console.error('Error loading FullCalendar', error);
            });
    }

    fetchAssignments() {
        console.log('Applying filters with the following IDs:');
        console.log('Resource ID:', this.selectedResourceId);
        console.log('Region ID:', this.selectedRegionId);
        console.log('Practice ID:', this.selectedPracticeId);
        console.log('Group ID:', this.selectedGroupId);
    
        fetchAllAssignments({
            projectName: this.projectName,
            resourceId: this.selectedResourceId,
            regionId: this.selectedRegionId,
            practiceId: this.selectedPracticeId,
            groupId: this.selectedGroupId
        })
            .then(result => {
                console.log('Assignments fetched:', result);
                this.assignments = result;
                this.prepareEvents(); // Prepare events from the fetched data
                this.initialiseFullCalendarJs(); // Re-initialize the calendar with new events
            })
            .catch(error => {
                console.error('Error fetching assignments', error);
            });
    }    

    prepareEvents() {
        this.allEvents = this.assignments.map(assignment => {
            const startDate = assignment.pse__Start_Date__c;
            const endDate = assignment.pse__End_Date__c;
            const dateParts = endDate.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            date.setDate(date.getDate() + 1);
            const formattedEndDate = date.toISOString().split('T')[0];

            return {
                id: assignment.Id,
                title: assignment.Name,
                start: startDate,
                end: formattedEndDate,
                allDay: true,
                description: assignment.Description__c || '',
                extendedProps: {
                    resourceName: assignment.pse__Resource__r?.Name || '',
                    projectName: assignment.pse__Project__r?.Name || ''
                }
            };
        });
        this.initialiseFullCalendarJs();
    }

    initialiseFullCalendarJs() {
        const ele = this.template.querySelector('.fullcalendarjs');
        
        // Destroy the existing calendar if it exists
        if ($.fn.fullCalendar && $(ele).fullCalendar('getCalendar')) {
            $(ele).fullCalendar('destroy');
        }
    
        // Initialize the calendar with updated events
        $(ele).fullCalendar({
            timezone: 'none',
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,basicWeek,basicDay,listWeek'
            },
            defaultDate: new Date(),
            navLinks: true,
            editable: false,
            eventLimit: true,
            events: this.allEvents,
            eventClick: this.eventClickHandler.bind(this),
            dayClick: this.dayClickHandler.bind(this)
        });
    }    

    // Event Handlers
    eventClickHandler(event) {
        this.selectedEvent = {
            title: event.title,
            start: event.start,
            end: event.end,
            description: event.description,
            resourceName: event.extendedProps.resourceName,
            projectName: event.extendedProps.projectName
        };
    }

    dayClickHandler() {
        this.createRecord = true;
    }

    closeModal() {
        this.selectedEvent = undefined;
    }

    createCancel() {
        this.createRecord = false;
    }

    // Onchange Handlers for Filters
    handleResourceChange(event) {
        this.selectedResourceId = event.detail.recordId;
        console.log('Resource selected:', event.detail.recordId);
    }

    handleRegionChange(event) {
        this.selectedRegionId = event.detail.recordId;
        console.log('Region selected:', event.detail.recordId);
    }

    handlePracticeChange(event) {
        this.selectedPracticeId = event.detail.recordId;
        console.log('Practice selected:', event.detail.recordId);
    }

    handleGroupChange(event) {
        this.selectedGroupId = event.detail.recordId;
        console.log('Group selected:', event.detail.recordId);
    }

    // Apply Filters Button
    applyFilters() {
        console.log('Apply Filters clicked');

        // Retrieve values from the lightning-record-pickers
        const resourcePicker = this.template.querySelector('[data-id="resourcePicker"]');
        const regionPicker = this.template.querySelector('[data-id="regionPicker"]');
        const practicePicker = this.template.querySelector('[data-id="practicePicker"]');
        const groupPicker = this.template.querySelector('[data-id="groupPicker"]');

        // Log the values and IDs
        console.log('Resource:', resourcePicker?.value, 'ID:', this.selectedResourceId);
        console.log('Region:', regionPicker?.value, 'ID:', this.selectedRegionId);
        console.log('Practice:', practicePicker?.value, 'ID:', this.selectedPracticeId);
        console.log('Group:', groupPicker?.value, 'ID:', this.selectedGroupId);

        // Fetch assignments with the selected filter IDs
        this.fetchAssignments();
    }

    // Clear Filters Button
    clearFilters() {
        console.log('Clear Filters clicked');
    
        // Clear selected IDs
        this.selectedResourceId = null;
        this.selectedRegionId = null;
        this.selectedPracticeId = null;
        this.selectedGroupId = null;
    
        // Clear the values of the pickers
        const resourcePicker = this.template.querySelector('[data-id="resourcePicker"]');
        const regionPicker = this.template.querySelector('[data-id="regionPicker"]');
        const practicePicker = this.template.querySelector('[data-id="practicePicker"]');
        const groupPicker = this.template.querySelector('[data-id="groupPicker"]');
    
        if (resourcePicker) {
            resourcePicker.value = null;
        }
        if (regionPicker) {
            regionPicker.value = null;
        }
        if (practicePicker) {
            practicePicker.value = null;
        }
        if (groupPicker) {
            groupPicker.value = null;
        }
    
        console.log('Filters cleared. Resource ID:', this.selectedResourceId);
        console.log('Filters cleared. Region ID:', this.selectedRegionId);
        console.log('Filters cleared. Practice ID:', this.selectedPracticeId);
        console.log('Filters cleared. Group ID:', this.selectedGroupId);
    
        // Fetch all assignments without filters
        this.fetchAssignments();
    }
        
    
}
