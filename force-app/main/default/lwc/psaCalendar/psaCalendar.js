import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllAssignments from '@salesforce/apex/PsaCalendarService.fetchAllAssignments';

export default class PsaCalendar extends LightningElement {
  fullCalendarJsInitialized = false;
  @track assignments = [];
  @track selectedEvent = undefined;

  renderedCallback() {
    // Initialize FullCalendarJS resources only once
    if (this.fullCalendarJsInitialized) {
      console.log('FullCalendarJS is already initialized.');
      return;
    }
    this.fullCalendarJsInitialized = true;

    console.log('Loading FullCalendarJS resources...');
    Promise.all([
      loadScript(this, FullCalendarJS + '/jquery.min.js'),
      loadScript(this, FullCalendarJS + '/moment.min.js'),
      loadScript(this, FullCalendarJS + '/fullcalendar.min.js'),
      loadStyle(this, FullCalendarJS + '/fullcalendar.min.css')
    ])
      .then(() => {
        console.log('FullCalendarJS resources loaded successfully.');
        this.fetchAndInitializeEvents();
      })
      .catch((error) => {
        console.error('Error loading FullCalendarJS resources:', error);
      });
  }

  fetchAndInitializeEvents() {
    console.log('Fetching assignments from Apex...');
    fetchAllAssignments()
        .then((result) => {
            console.log('Assignments fetched from Apex:', JSON.stringify(result, null, 2));
            this.assignments = result.map((item) => {
                console.log('Processing item:', item);
                return {
                    id: item.Id,
                    title: item.Name,
                    start: item.pse__Start_Date__c, // Start date
                    end: item.pse__End_date__c, // End date
                    allDay: true, // Multi-day events
                };
            });
            console.log('Events before filtering:', this.assignments);
            this.assignments = this.assignments.filter(event => event.start && event.end);
            console.log('Events after filtering:', this.assignments);
            this.initializeFullCalendar();
        })
        .catch((error) => {
            console.error('Error fetching assignments from Apex:', error);
        });
    }

    initializeFullCalendar() {
        console.log('Initializing FullCalendarJS with events:', this.assignments);
        const calendarEl = this.template.querySelector('div.fullcalendarjs');

        if (!calendarEl) {
            console.error('Calendar container not found!');
            return;
        }

        try {
            $(calendarEl).fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay,listWeek',
                },
                themeSystem: 'standard',
                defaultDate: new Date(), // Defaults to today’s date
                navLinks: true, // Allow navigation by clicking on days/weeks
                editable: false, // Disable drag-and-drop for events
                eventLimit: true, // Limits number of events per day
                events: this.assignments, // Assignments loaded from Apex
                eventClick: (event) => this.handleEventClick(event),
            });
        } catch (error) {
            console.error('Error initializing FullCalendarJS:', error);
        }
    }


  handleEventClick(event) {
    console.log('Event clicked:', event);
    this.selectedEvent = event; // Opens modal or displays event details
  }

  closeModal() {
    console.log('Closing modal for selected event.');
    this.selectedEvent = undefined;
  }
}
