import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllAssignments from '@salesforce/apex/PsaCalendarService.fetchAllAssignments';

export default class PsaCalendar extends LightningElement {
    @track assignments = [];
    @track allEvents = [];
    @track selectedEvent;
    @track createRecord = false;
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
        fetchAllAssignments()
            .then(result => {
                this.assignments = result;
                this.prepareEvents();
            })
            .catch(error => {
                console.error('Error fetching assignments', error);
            });
    }

    prepareEvents() {
        this.allEvents = this.assignments.map(assignment => {
            const startDate = assignment.pse__Start_Date__c; // Original start date
            const endDate = assignment.pse__End_Date__c;     // Original end date

            // Add one day to endDate for the exclusive end date
            const dateParts = endDate.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            date.setDate(date.getDate() + 1);
            const formattedEndDate = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'

            return {
                id: assignment.Id,
                title: assignment.Name,
                start: startDate,            // Use the date string directly
                end: formattedEndDate,       // Exclusive end date
                allDay: true,
                description: assignment.Description__c || '',
                extendedProps: {
                    resourceName: assignment.pse__Resource__r ? assignment.pse__Resource__r.Name : '',
                    projectName: assignment.pse__Project__r ? assignment.pse__Project__r.Name : '',
                    originalStartDate: startDate, // Include original start date
                    originalEndDate: endDate      // Include original end date
                }
            };
        });
        this.initialiseFullCalendarJs();
    }

    initialiseFullCalendarJs() {
        const ele = this.template.querySelector('.fullcalendarjs');
        // eslint-disable-next-line no-undef
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

    eventClickHandler(event, jsEvent, view) {
        const extendedProps = event.extendedProps || {};
        const startDateStr = extendedProps.originalStartDate || '';
        const endDateStr = extendedProps.originalEndDate || '';

        // Append 'T00:00:00Z' to specify midnight UTC
        const startDate = startDateStr ? startDateStr + 'T00:00:00Z' : '';
        const endDate = endDateStr ? endDateStr + 'T00:00:00Z' : '';

        this.selectedEvent = {
            title: event.title,
            start: startDate,
            end: endDate,
            description: event.description || '',
            resourceName: extendedProps.resourceName || '',
            projectName: extendedProps.projectName || ''
        };
    }

    dayClickHandler(date, jsEvent, view) {
        this.createRecord = true;
    }

    closeModal() {
        this.selectedEvent = undefined;
    }

    createCancel() {
        this.createRecord = false;
    }
}
