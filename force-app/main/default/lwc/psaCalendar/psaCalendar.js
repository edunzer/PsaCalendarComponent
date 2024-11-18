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
            // Initialize the calendar after scripts are loaded
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
            return {
                id: assignment.Id,
                title: assignment.Name,
                start: assignment.pse__Start_Date__c,
                // Adjust end date to be exclusive if necessary
                end: this.getExclusiveEndDate(assignment.pse__End_Date__c),
                allDay: true,
                description: assignment.Description__c || ''
            };
        });
        this.initialiseFullCalendarJs();
    }

    getExclusiveEndDate(endDate) {
        let date = new Date(endDate);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    }

    initialiseFullCalendarJs() {
        const ele = this.template.querySelector('.fullcalendarjs');
        // eslint-disable-next-line no-undef
        $(ele).fullCalendar({
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
        // Prepare selected event data for display
        this.selectedEvent = {
            title: event.title,
            start: event.start ? event.start.toISOString() : '',
            end: event.end ? event.end.toISOString() : '',
            description: event.description || ''
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
