import { LightningElement, track, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllAssignments from '@salesforce/apex/PsaCalendarService.fetchAllAssignments';
import getPicklistValues from '@salesforce/apex/PsaCalendarService.getPicklistValues';

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
    @track selectedReportsToId = null;
    @track selectedSubCategory = null;
    @track selectedRole = null;

    @api showResourceFilter;
    @api showRegionFilter;
    @api showPracticeFilter;
    @api showGroupFilter;
    @api showReportsToFilter;
    @api showSubCategoryFilter;
    @api showRoleFilter;

    @track subCategoryOptions = [];
    @track roleOptions = [];

    get showFilters() {
        return (
            this.showResourceFilter ||
            this.showRegionFilter ||
            this.showPracticeFilter ||
            this.showGroupFilter ||
            this.showReportsToFilter ||
            this.showSubCategoryFilter ||
            this.showRoleFilter
        );
    }

    // Dynamically adjust calendar width
    get calendarClass() {
        return this.showFilters ? 'slds-col slds-size_10-of-12' : 'slds-col slds-size_12-of-12';
    }

    get calendarStyle() {
        return this.showFilters ? 'width: 85%;' : 'width: 100%;';
    }

    connectedCallback() {
        // Fetch picklist options for Sub-Category and Role
        this.fetchPicklistOptions('pse__Assignment__c', 'Sub_category_picklist__c', 'subCategoryOptions');
        this.fetchPicklistOptions('pse__Assignment__c', 'pse__Role__c', 'roleOptions');
    }

    fetchPicklistOptions(objectName, fieldName, targetProperty) {
        getPicklistValues({ objectName, fieldName })
            .then(result => {
                this[targetProperty] = result.map(value => ({ label: value, value }));
            })
            .catch(error => {
                console.error(`Error fetching picklist values for ${fieldName}:`, error);
            });
    }

    resourceFilter = {
        criteria: [
            { fieldPath: 'pse__Is_Resource__c', operator: 'eq', value: true },
            { fieldPath: 'pse__External_Resource__c', operator: 'eq', value: false }
        ]
    };    

    displayInfoResource = {
        primaryField: 'Name',
        additionalFields: ['Account.Name']
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
        fetchAllAssignments({
            projectName: this.projectName,
            resourceId: this.selectedResourceId,
            regionId: this.selectedRegionId,
            practiceId: this.selectedPracticeId,
            groupId: this.selectedGroupId,
            reportsToId: this.selectedReportsToId,
            subCategory: this.selectedSubCategory,
            role: this.selectedRole
        })
            .then(result => {
                this.assignments = result;
                this.prepareEvents();
                this.initialiseFullCalendarJs();
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
    }

    handleRegionChange(event) {
        this.selectedRegionId = event.detail.recordId;
    }

    handlePracticeChange(event) {
        this.selectedPracticeId = event.detail.recordId;
    }

    handleGroupChange(event) {
        this.selectedGroupId = event.detail.recordId;
    }

    handleReportsToChange(event) {
        this.selectedReportsToId = event.detail.recordId;
    }

    handleSubCategoryChange(event) {
        this.selectedSubCategory = event.detail.value;
    }

    handleRoleChange(event) {
        this.selectedRole = event.detail.value;
    }

    // Apply Filters Button
    applyFilters() {
        this.fetchAssignments();
    }

    // Clear Filters Button
    clearFilters() {
        this.selectedResourceId = null;
        this.selectedRegionId = null;
        this.selectedPracticeId = null;
        this.selectedGroupId = null;
        this.selectedReportsToId = null;
        this.selectedSubCategory = null;
        this.selectedRole = null;

        const pickers = ['resourcePicker', 'regionPicker', 'practicePicker', 'groupPicker', 'reportsToPicker'];
        pickers.forEach(picker => {
            const element = this.template.querySelector(`[data-id="${picker}"]`);
            if (element) {
                element.clearSelection();
            }
        });

        // Clear the values of the comboboxes
        const subCategoryComboBox = this.template.querySelector('[data-id="subCategoryComboBox"]');
        const roleComboBox = this.template.querySelector('[data-id="roleComboBox"]');

        if (subCategoryComboBox) {
            subCategoryComboBox.value = null;
        }
        if (roleComboBox) {
            roleComboBox.value = null;
        }

        this.fetchAssignments();
    }
}
