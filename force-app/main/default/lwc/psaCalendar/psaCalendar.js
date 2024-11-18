import { LightningElement, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllAssignments from '@salesforce/apex/PsaCalendarService.fetchAllAssignments';

export default class PsaCalendar extends LightningElement {
  @track assignments = [];
  @track selectedEvent = undefined;

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
        console.log('Assignments fetched:', result);
        this.assignments = result.map((item) => {
          return {
            id: item.Id,
            title: item.Name,
            start: item.pse__Start_Date__c,
            end: item.pse__End_date__c
          };
        });
        console.log('Assignments processed for FullCalendar:', this.assignments);
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
