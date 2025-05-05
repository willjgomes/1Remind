function doGet() {
  return HtmlService.createTemplateFromFile('1RemindApp').evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1');
  //return HtmlService.createTemplateFromFile('GPT-SegmentedProgress').evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(File) {
  return HtmlService.createHtmlOutputFromFile(File).getContent();
};

function getEventsModel(timePeriod){

  //Setup the EventsModel
  const data = {
    bills:  {id:'',events:[]},
    appts:  {id:'',events:[]},
    promos: {id:'',events:[]},
  };
  
  //const allUserCals = CalendarApp.getAllOwnedCalendars();
  const allUserCals = CalendarApp.getAllCalendars();
  const defaultCalId = CalendarApp.getDefaultCalendar().getId();
  for (const cal of allUserCals){
    console.log('[' + cal.getName() + ']');    

    const calEvents = getAllEvents(cal, timePeriod);
    const eventlist = getEventsList(cal, calEvents);    

    for (const e of eventlist)    {
      console.log(e.summary + ": " + e.startTime);
      console.log("    : " + JSON.stringify(e));
      console.log("    : " + JSON.stringify(e.startTime));
    }

    if (cal.getName() == 'Bills'){
       data.bills.events = eventlist;
       data.bills.id = cal.getId();
    } else if ((cal.getName().indexOf('Appointments') >= 0) || cal.getId() === defaultCalId){
        data.appts.events = data.appts.events.concat(eventlist);
        data.appts.events.sort((a,b) => { 
          if (b.startTime.getTime() > a.startTime.getTime()) return -1;
          if (a.startTime.getTime() > b.startTime.getTime()) return 1;
          return 0;
        })
        if (data.appts.id == ''){
          data.appts.id = cal.getId();
        }
    } else if (cal.getName() == 'Promotions'){
        data.promos.events = eventlist;
        data.promos.id = cal.getId();
    }    
  }
  
  
  
  //It's not clear to my why have to convert to JSON String when I didn't do it for AppData
  d = JSON.stringify(data);
  console.log(d);
  return d;
}


function getEventsList(cal, calEvents){
  const eventlist = [];   

  for (const event of calEvents){
    var details = new Object();
    details.id = event.getId();
    details.summary = event.getSummary();
    
    details.start = util_formatTime(event.getStartTime());
    details.end   = util_formatTime(event.getEndTime());

    //Added this to avoid UTC timezone issue with stringify
    details.date  = util_getDateString(event.getStartTime());

    // The full start/end timestamps are required later to properly lookup 
    // the event occurence for updating, however:
    //TODO: WARNING!! This returns a date with a timezone that gets improperly mapped
    //to UTC date or something when doing JSON.stringify, which messes up the date
    //this might be a problem when trying to update an event! Might need to rebuild
    //timestamps from the date and time components directly
    details.startTime  = event.getStartTime();
    details.endTime    = event.getEndTime();
    
    details.recurring  = event.isRecurringEvent();
    if (cal.getName() == 'Bills'){
      details.summary = parseBillTitle(details.summary);
      details.details = getBillDetails(event.getDescription())
    }
    eventlist.push(details);
    //console.log(details)    
  }

  return eventlist;
}


function getAllEvents(cal, timePeriod) {
  let calEvents = null;

  if (timePeriod == 'today') {
    calEvents = cal.getEventsForDay(new Date());
  } else{
    const startTime = new Date();
    let endTime = new Date();
        
    if (timePeriod == 'tomorrow'){
      startTime.setDate(startTime.getDate() + 1);
      endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
    } else if (timePeriod == 'thisweek'){
      startTime.setDate(startTime.getDate() + 2);
      endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + (6 - startTime.getDay()));
    } else if (timePeriod == 'nextweek'){
      startTime.setDate(startTime.getDate() + (7 - startTime.getDay()));
      endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + 6);
    }

    startTime.setHours(0, 0, 0, 0);    
    endTime.setHours(23, 59, 59, 999);

    console.log(timePeriod + ': ' + startTime + ' ' + endTime)      

    calEvents = cal.getEvents(startTime, endTime); 
  }
 
  return  calEvents;
}

function getAppData(){

  console.log("Logged in User: " +Session.getActiveUser().getEmail());

  const spreadsheetId = getAppDataSheetID();
  const rangeName = 'Settings!B1';
  
  let appData = {
    calendars:{billCID:'',promoCID:'',promoTCID:'',mainCID:'primary'},
    userInfo: {email:Session.getActiveUser().getEmail()}
    };
    
  try {
    if (spreadsheetId != ''){
      // Get the values from the spreadsheet using spreadsheetId and range.
      const values = Sheets.Spreadsheets.Values.get(spreadsheetId, rangeName).values;
      //  Print the values from spreadsheet if values are available.
      if (!values) {
        console.log('No data found in bootstrap spreadsheet.');
        return;
      }
      // Get Calendars from spreadsheet
      for (const row in values) {
        //console.log(values[row][0]);
        let ssCalData = JSON.parse(values[row][0]);
        appData.calendars.billCID = ssCalData.billCID;
        appData.calendars.promoCID = ssCalData.promoCID;
        appData.calendars.mainCID = ssCalData.mainCID;
      }
    }

    // Attempt to find calendar ids by name if we didn't find in spreadsheet
    console.log("Searching calendars by name")
    const allUserCals = CalendarApp.getAllOwnedCalendars();
    for (const cal of allUserCals){
      console.log('[' + cal.getName() + ']');    

      if (cal.getName() == 'Bills' && appData.calendars.billCID == ''){
        appData.calendars.billCID = cal.getId();
      } else if (cal.getName() == 'Promotions' && appData.calendars.promoCID == ''){
        appData.calendars.promoCID = cal.getId();
      } else if (cal.getName() == 'Promo Tracker' && appData.calendars.promoTCID == ''){
        appData.calendars.promoTCID = cal.getId();
      }
    }
  
    // If calander ids still not found, assume they don't exist and create them
    if (appData.calendars.billCID == ''){
      console.log("Bills calendar not found! Creating it.")
      appData.calendars.billCID = CalendarApp.createCalendar('Bills').getId()
    }

    if (appData.calendars.promoCID == ''){
      console.log("Promotions calendar not found! Creating it.")
      appData.calendars.promoCID = CalendarApp.createCalendar('Promotions').getId()
    }

    if (appData.calendars.promoTCID == ''){
      console.log("Promotions calendar not found! Creating it.")
      appData.calendars.promoCID = CalendarApp.createCalendar('Promo Tracker').getId()
    }

  } catch (err) {
    // TODO (developer) - Handle Values.get() exception from Sheet API
    console.log(err.message);
  }

  console.log(appData);
  return appData;
}

function getAppDataSheetID(){
  //I am storing the sheet ID that will be used for App Data in a google Calendar event named Sheet ID on 1/1/2000
  // (Only way for now, unless I find a better way of bootstraping the sheet ID)

  const calendarId = 'primary';
  // Add query parameters in optionalArgs
  const optionalArgs = {
    maxResults: 11,
    q: 'SheetID'
  };

  // call Events.list method to list the calendar events using calendarId optional query parameter
  const response = Calendar.Events.list(calendarId, optionalArgs);
  const events = response.items;
  var data = [];

  let sheetID = '';

  if (events.length  > 0) {
    for (const event of events) {
      sheetID = event.summary;
      sheetID = sheetID.substring(sheetID.indexOf('{')+1,sheetID.indexOf('}')).trim();
      console.log("Spreadheet ID: " + sheetID);
    }
  } else{
    Logger.log("App did not find SheetID Event in users primary calendar to bootstrap data from Google Sheet!");
  }

  return sheetID;
}


