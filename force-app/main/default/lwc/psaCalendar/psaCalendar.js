import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllAssignments from '@salesforce/apex/PsaCalendarService.fetchAllAssignments';

export default class PsaCalendar extends LightningElement {
  @track assignments = [];
  @track selectedEvent = undefined;
  fullCalendarJsInitialized = false;

  renderedCallback() {
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
        this.getAssignments();
      })
      .catch((error) => {
        console.error('Error loading FullCalendarJS resources:', error);
      });
  }

  getAssignments() {
    console.log('Fetching assignments from Apex...');
    fetchAllAssignments()
      .then((result) => {
        this.assignments = result.map((item) => {
          return {
            id: item.Id,
            title: item.Name,
            start: item.pse__Start_Date__c ? new Date(item.pse__Start_Date__c).toISOString() : null,
            end: item.pse__End_date__c ? new Date(item.pse__End_date__c).toISOString() : null,
            allDay: true // Ensures the event spans across multiple days
          };
        }).filter((event) => event.start && event.end); // Ensure no null dates
        console.log('Mapped events for FullCalendar:', JSON.stringify(this.assignments, null, 2));
        this.initializeCalendar();
      })
      .catch((error) => {
        console.error('Error fetching assignments from Apex:', error);
      });
  }

  initializeCalendar() {
    console.log('Initializing FullCalendarJS with events:', this.assignments);
    const ele = this.template.querySelector('div.fullcalendarjs');
    $(ele).fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      events: this.assignments,
      allDayDefault: true, // Treats all events as all-day unless specified otherwise
      displayEventTime: false, // Hides time display for all-day events
      eventClick: (event) => {
        console.log('Event clicked:', event);
        this.selectedEvent = event;
      }
    });
  }

  closeModal() {
    console.log('Closing modal for selected event.');
    this.selectedEvent = undefined;
  }
}
