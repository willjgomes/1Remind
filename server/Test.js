function listUpcomingEvents() {
  const calendarId = 'primary';
  // Add query parameters in optionalArgs
  const optionalArgs = {
    timeMin: (new Date()).toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 10,
    orderBy: 'startTime'
    // use other optional query parameter here as needed.
  };
  try {
    // call Events.list method to list the calendar events using calendarId optional query parameter
    const response = Calendar.Events.list(calendarId, optionalArgs);
    const events = response.items;
    if (events.length === 0) {
      console.log('No upcoming events found');
      return;
    }
    // Print the calendar events
    for (const event of events) {
      let when = event.start.dateTime;
      if (!when) {
        when = event.start.date;
      }
      console.log('%s (%s)', event.summary, when);
    }
  } catch (err) {
    // TODO (developer) - Handle exception from Calendar API
    console.log('Failed with error %s', err.message);
  }
}

function listEvents() {
  const calendarId = 'primary';
  // Add query parameters in optionalArgs
  const optionalArgs = {
    timeMin: (new Date()).toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 10,
    orderBy: 'startTime'
    // use other optional query parameter here as needed.
  };
  try {
    // call Events.list method to list the calendar events using calendarId optional query parameter
    const response = Calendar.Events.list(calendarId, optionalArgs);
    const events = response.items;
    var data = [];
    if (events.length === 0) {
      return ['No events found','',''];    
    }
    // Print the calendar events
    for (const event of events) {
      let when = event.start.dateTime;
      if (!when) {
        when = event.start.date;
      }
      data.push(event);
    }
    console.log(data);
    return data;
  } catch (err) {
    // TODO (developer) - Handle exception from Calendar API
    return ['error','',''];
  }
}

function debugEvent(){
  const today = new Date();
  console.log(today.toLocaleString());

  const calId = "356dcd95730fd5b02895226338055d9b37e2d5041ad0d678e82ddcecc07d9b06@group.calendar.google.com";
  const eventId = "3qpqksdvdrk8orkofs7plth3lc";
  const cal = CalendarApp.getCalendarById(calId)  ;
  //const e = cal.getEventById("5u5onjba85jq98paejkd4ke95v");
  const e = cal.getEventById("3qpqksdvdrk8orkofs7plth3lc");

  console.log(`
    ID:         ${e.getId()}\n
    Title:      ${e.getTitle()}\n
    Recurring:  ${e.isRecurringEvent()}\n
    Create Dt:  ${e.getDateCreated()}\n
    Begin Dt:   ${e.getStartTime()}\n
    End Dt:     ${e.getEndTime()}\n
  `);

  today.setHours(0,0,0,0);

  console.log(e.getStartTime().getTime() < today.getTime());

   
try {
    // Get the event using the advanced Calendar API
    const event = Calendar.Events.get(calId, eventId);
    
    if (event) {
      // Check if the event has a recurrence rule
      if (event.recurrence) {
        Logger.log(`Recurrence Rule: ${event.recurrence.join(', ')}`);
      } else {
        Logger.log("This event does not have a recurrence rule.");
      }
    } else {
      Logger.log("Event not found.");
    }
  } catch (error) {
    Logger.log(`Error retrieving event: ${error}`);
  }

}

function debugEvents() {
  let calId = '356dcd95730fd5b02895226338055d9b37e2d5041ad0d678e82ddcecc07d9b06@group.calendar.google.com';
  //let calid = 'primary';
  
  let date = new Date(2024,8,26);
  
  //Manual 2:  75l0ag3mcg6qcunrvvu9h8el1l@google.com
  //
  //New Monthly: 808aukg0bfsq3mv7sgd8o792tk@google.com (Each occurenceSame ID when created, Same Id when Edited) - 
  //      Edit in Google Calendar to change day to following day: 
  //          - Event on 24 shows up on calendar but not via API call, 
  //          - Event on 23 still shows up via API with same same id, but on Calnedar
  //          - The bill on Nov 23 didn't change but kept old id
  // It appears the dates are not properly reflected on an event series change in GOogle Calendar, does something weird.

  const cal = CalendarApp.getCalendarById(calId)  
  const calEvents = cal.getEventsForDay(date);
  for (const event of calEvents){
    console.log(`${event.getId()}|${event.getTitle()}|${event.isRecurringEvent()}|${event.getDateCreated()}`);
    /*
    if (event.getTitle() == 'Manual 2'){
      event.setTitle("M2");
      console.log('Title Updated');
    }
    */
  }
}

function testRecurUpdate(){
  //const cal = CalendarApp.getCalendarById("356dcd95730fd5b02895226338055d9b37e2d5041ad0d678e82ddcecc07d9b06@group.calendar.google.com")  
  const cal = CalendarApp.getCalendarById("primary")  
  /*
  calEvent = cal.getEventById("o23g0dj1e08ruhmepdi5do2t4c");
  console.log(calEvent.getTitle() + " "  + calEvent.getAllDayStartDate());
  const startDate = calEvent.getAllDayStartDate();
  startDate.setDate(25);
  eventSeries = calEvent.getEventSeries();
  calEvent.setTitle("Is this CalAPI4 Man Edit 2???") ;
  */
  recurrence = CalendarApp.newRecurrence().addMonthlyRule().onlyOnMonthDay('25');
  console.log(recurrence.toString());
  //calEvent.setRecurrence(recurrence )
  //eventSeries.setRecurrence(recurrence, startDate);
}


/**
 * Lists the calendars shown in the user's calendar list.
 * @see https://developers.google.com/calendar/api/v3/reference/calendarList/list
 */
function listCalendars() {
  let calendars;
  let pageToken;
  do {
    calendars = Calendar.CalendarList.list({
      maxResults: 100,
      pageToken: pageToken

    });
    if (!calendars.items || calendars.items.length === 0) {
      console.log('No calendars found.');
      return;
    }
    // Print the calendar id and calendar summary
    for (const calendar of calendars.items) {
      console.log('%s (ID: %s)', calendar.summary, calendar.id);
    }
    pageToken = calendars.nextPageToken;
  } while (pageToken);
}


function createRecurringEvent() {
  const calendarId = 'primary'; // Use 'primary' for the user's primary calendar
  const event = {
    summary: 'CalAPI 4',
    location: 'Online',
    description: 'A recurring team meeting to discuss project updates.',
    start: {
      date: '2024-10-23', // Adjust timezone as necessary
    },
    end: {
      date: '2024-10-24',
    },
    recurrence: [
      'RRULE:FREQ=MONTHLY;BYMONTHDAY=23;', // Weekly on Wednesday for 10 occurrences
    ],
  };

  try {
    const createdEvent = Calendar.Events.insert(event, calendarId);
    Logger.log('Event created: ' + createdEvent.htmlLink);
    Logger.log(createdEvent.id);
  } catch (error) {
    Logger.log('Error creating event: ' + error.message);
  }
}

function updateRecurringEventWithPut() {
  const calendarId = 'primary'; // Use 'primary' for the user's primary calendar //rtgaa0pmf25mu6fd72dd0io2t1_R20241126
  const eventId = 'rtgaa0pmf25mu6fd72dd0io2t1_R20241126'; // Replace with your event ID

  // Retrieve the existing event to get its details
  const existingEvent = Calendar.Events.get(calendarId, eventId);

  console.log(existingEvent.summary + " " + existingEvent.recurrence);
  // Define the new recurrence rule with an end date
  const newRecurrence = [
    'RRULE:FREQ=MONTHLY;BYMONTHDAY=28;', // Update to desired end date
  ];

  // Create an updated event object
  const updatedEvent = {
    id: existingEvent.id, // Keep the same event ID
    summary: existingEvent.summary,
    location: existingEvent.location,
    description: existingEvent.description,
    start: existingEvent.start,
    end: existingEvent.end,
    recurrence: newRecurrence,
  };

  try {
    // Use the put method to update the event
    const event = Calendar.Events.update(updatedEvent, calendarId, eventId);
    Logger.log('Updated event: ' + event.htmlLink);
  } catch (error) {
    Logger.log('Error updating event: ' + error.message);
  }
}

function updateRecurringEventWithEndDate() {
  const calendarId = '356dcd95730fd5b02895226338055d9b37e2d5041ad0d678e82ddcecc07d9b06@group.calendar.google.com'; // Use 'primary' for the user's primary calendar
  const eventId = '0pe8v5fld1c78bivbniq5h96te'; // Replace with your event ID

  // Define the new recurrence rule with an end date
  const updatedEvent = {
    recurrence: [
      'RRULE:FREQ=MONTHLY;BYMONTHDAY=25;UNTIL=2024-11-27', // Update to desired end date
    ],
  };

  try {
    // Update the event using the Calendar API
    const event = Calendar.Events.patch(updatedEvent, calendarId, eventId);
    Logger.log('Updated event: ' + event.htmlLink);
  } catch (error) {
    Logger.log('Error updating event: ' + error.message);
  }
}