function getBillMonthEventsModel(month){
  //Setup the EventsModel
  const data = {id:'',events:[]};

  Logger.log("Month:" + month);
  let today = new Date();
  let monthStart;
  if (month == 'next'){
    Logger.log("What is going on")
    monthStart = new Date(today.getFullYear(), today.getMonth() + 1);
  } else {
    monthStart = new Date();
  }
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const monthEnd   = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  monthEnd.setHours(23,59,59,999);

  Logger.log(monthStart + " " + monthStart.getFullYear() + " " +  monthEnd)

  const allUserCals = CalendarApp.getAllOwnedCalendars();
  for (const cal of allUserCals){
    console.log('[' + cal.getName() + ']');    

    if (cal.getName() == 'Bills'){
      const calEvents = cal.getEvents(monthStart, monthEnd); 
      const eventlist = getEventsList(cal, calEvents);
       data.events = eventlist;
       data.id = cal.getId();
    }    
  }

  for (const b of data.events){
    console.log(b.summary + " " + b.startTime);
  }

  return JSON.stringify(data);
}

function saveBill(eventData){
  //Capitalization Function
  //https://www.npmjs.com/package/capitalize?activeTab=code

  eventCal = CalendarApp.getCalendarById(eventData.calId);

  eTitle = getBillTitle(eventData.payee, null);
  eDetails = {
    "payee": eventData.payee,
    "payStatus" : "", //PAID, VERIFIED
    "paidDate" : "",
    "payType" : "",   //MANUAL,SCHEDULED,AUTO
    "autoDay" : "",
  }

  options = {
    description: JSON.stringify(eDetails)
  }

  if (eventData.monthly){
    eDate = getMonthlyBillDate(eventData.dueDay)
    recurrence = CalendarApp.newRecurrence().addMonthlyRule().onlyOnMonthDay(eventData.dueDay);
    eventCal.createAllDayEventSeries(eTitle, eDate, recurrence, options);
  } else {
    eDate = util_parseDate(eventData.dueDate)
    eventCal.createAllDayEvent(eTitle, eDate, options);
  }
}

function parseBillTitle(summary){
  return (summary.indexOf(":") > 0) ? summary.substring(summary.lastIndexOf(":") + 1) : summary;
}

function getBillTitle(payee, billDetails){
  billTitle = '[DUE] Bill: ' + payee; 
  if (billDetails != null){
    if (['PAID','VERIFIED'].includes(billDetails.payStatus)){
      billTitle = `[PAID: ${billDetails.paidDate.substring(5,10).replace('-','/')}] Bill: ${payee}`
    } else if (billDetails.payType == 'SCHEDULED'){
      billTitle = `[SCHD: ${billDetails.paidDate.substring(5,10).replace('-','/')}] Bill: ${payee}`
    } else if (billDetails.payType == 'AUTO'){
      billTitle = `[AUTO] Bill: ${payee}`
    } else if (billDetails.payStatus == 'SKIPPED'){
      billTitle = `[SKIP] Bill: ${payee}`
    }
  }

  return billTitle;
}

// This calculates the date for a monthly recurring bill based on the day entered
// If today is less than the day set date for this month, if it is greater than today
// start from next month.
function getMonthlyBillDate(day){

  var now = new Date();
  month = now.getMonth(); 
  year  = now.getFullYear()

  if (day < now.getDate()){
    // If current month is Dec (11), reset to Jan (0), otherwise set to next month (+1)
    month = (month == 11 ? 0:month + 1);
  }

  //return day + " " + month + " " + year;
  return new Date(year, month, day)
}

//This gets the JSON data from Bill description field
function getBillDetails(description){
  dString = "{}";
  
 console.log("Bill Description:" + description);

  if (description.length > 0 && description.indexOf('{') >= 0){
    dString = description;
    dString = dString.substring(dString.indexOf('{'),dString.indexOf('}')+1).trim();
    console.log("Bill Description:" + dString);
  }

  const details = JSON.parse(dString);
  details.payee     = details.payee     ? details.payee : '';
  details.payType   = details.payType   ? details.payType : '';
  details.paidDate  = details.paidDate  ? details.paidDate : '';
  details.payStatus = details.payStatus ? details.payStatus : '';
  details.autoDay   = details.autoDay   ? details.autoDay : '';

  return details;
}

//TODO: Retest to see if any issue where creating a recurring event doesn't seem to update the recurring instances
//Updates the description field JSON Object structure of the vent
function updateBillDetails(billCalId, billEvent){
  console.log(`Bill Calendar ID: ${billCalId} Pay Status: ${billEvent.details.payStatus} Date: ${billEvent.startTime}
    Pay Type: ${billEvent.details.payType}`);

  const cal = CalendarApp.getCalendarById(billCalId);

  // Find the start and end times of the event so we can find the specific instance
  // (This is needed since event id returns the master event)
  const startTime = util_parseDate(billEvent.startTime)
  startTime.setHours(0, 0, 0, 0);
  const endTime = util_parseDate(billEvent.endTime)
  endTime.setHours(23, 59, 59, 999);
  
  //Set the mod date to today
  billEvent.details.modDate = new Date();

  //In the case where this event was created manually outside the app
  //properly set the payee info in the detail
  if (!billEvent.details.payee || billEvent.details.payee == ''){
      billEvent.details.payee = billEvent.summary.trim();
  }
  
  //If this is an AutoPay event, update the autopay details on master record
  if (billEvent.details.payType == 'AUTO'){
    const masterEvent = cal.getEventById(billEvent.id);
    console.log(masterEvent.getDescription() + " " + masterEvent.isRecurringEvent());
  }

  // Find occurence of Bill to update from all events for the day, since
  // using event id to getEvent returns the master event, and updating that 
  // updates all instances of event.
  // TODO: Is there more efficient way to do this?
  for (const event of cal.getEvents(startTime, endTime)){
    if (event.getId() == billEvent.id){
        event.setTitle(getBillTitle(billEvent.details.payee, billEvent.details));
// ====> TODO: Replace only the JSON portion in case manually added info to description
        event.setDescription(JSON.stringify(billEvent.details));
        console.log('Updating event occurence');
        break;
      }
  }
}

function deleteBill(billCalId,billEvent){
  // Get the calendar by ID
  const calendar = CalendarApp.getCalendarById(billCalId);
  
  // If the calendar exists, proceed to delete the event
  if (calendar) {
    const event = calendar.getEventById(billEvent.id);
    
    // Check if the event exists
    if (event) {
      
      //Note: calling event.isRecurringEvent() does not return true on master event
      //rather have to check for the recurrence field, it was just easier to check 
      //recurring field i sent back via load events call
      if (!billEvent.recurring){
        event.deleteEvent(); // Delete the event
        Logger.log(`Single Event with ID ${billEvent.id} has been deleted.`);
      } else {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (today <= event.getStartTime()){
          event.deleteEvent();
          Logger.log(`Recurring Event with ID ${billEvent.id} deleted.`);
        } else {
          deleteRecurringBill(billCalId,billEvent.id);
        }        
      }
    } else {
      Logger.log(`No event found with ID ${billEvent.id}.`);
    }
  } else {
    Logger.log(`No calendar found with ID ${billCalId}.`);
  }
}

// This "deletes" a recurring monthly bill when there are existing
// bills prior to today by setting the end date of the event to yesterday.
function deleteRecurringBill(calId, eventId) {
  //Set the end date of event to yesterday.
  const untilDate = new Date();
  untilDate.setDate(untilDate.getDate() -1);
  const utcUntilDate = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  //Create the new recurrence rule string
  const recurrenceString = 'RRULE:FREQ=MONTHLY;UNTIL=' + utcUntilDate;
  console.log(recurrenceString);
  
  // Create the updated event with new recurence rule
  const updatedEvent = {recurrence: [recurrenceString,],};

  try {
    //The public calendar ID does not use the @ symbol for id
    const shortEventId = eventId.substring(0, eventId.indexOf('@'));
    Logger.log(shortEventId);
    
    // Update the event using the Calendar API
    const event = Calendar.Events.patch(updatedEvent, calId, shortEventId);
    Logger.log(`Recurring Event with ID ${billEvent.id} deleted with end date.`);
  } catch (error) {
    Logger.log('Error updating event: ' + error.message);
  }
}
