//Creates a new promotion event
function createPromo(promoCalId, promoData){
  console.log(promoData);

  //Get Promo Event Tracker Calendar
  eventCal = CalendarApp.getCalendarById(promoCalId);
 
  const eTitle = promoData.companyName;
  const eDetails = getCCNewDetailObject();

  //Copy attributes from form data to the details/desc object
  util_copyObject(promoData, eDetails);

  // Set the event start date to today
  let eStartDate = new Date();

  // Set the event end date to either the end date or the offer expire date
  let eEndDate = new Date();
  if (promoData.expireDate != null){
    eEndDate = util_parseDate(promoData.expireDate);
  }

  // If account open date specified and duration provided, calculate end date
  if (promoData.beginDate != null){
    eStartDate = util_parseDate(promoData.beginDate) ;
    eEndDate = new Date(eStartDate.getFullYear(), eStartDate.getMonth(), eStartDate.getDate());
    eEndDate.setDate(eEndDate.getDate() + parseInt(promoData.durationDays, 10));
    eDetails.endDate = util_getDateString(eEndDate);
  }
  
  // If end date specified use it instead (overrides calculated date)
  if (promoData.endDate != null){
    eEndDate = util_parseDate(promoData.endDate)
  }

  // If Multipe Transaction, create the required txnDetail line activities
  let numTxns = parseInt(promoData.numReqAllowTxns);
  console.log(promoData.numReqAllowTxns);
  console.log(numTxns);
  if (numTxns > 0){
    for (let i = 1; i <= numTxns; i++){
      txnActivity = getTxnActivityObject("Deposit "+i, promoData.minReqAmtPerTxn);
      txnActivity.required = true;
      eDetails.txnDetails.txnList.push(txnActivity);
    }
  }

  // Convert details to string
  console.log(eDetails);
  const options = {
    description: JSON.stringify(eDetails)
  }

  // Create the event in Google Calendar
  const event = eventCal.createAllDayEvent(eTitle, eStartDate, eEndDate, options);

  // Convert the saved event object back to vue model
  const promoEventModel = convertCalendarEventToPromoModelEvent(event);

  console.log(promoEventModel);
  return promoEventModel;
}

// JSON Object structure for the Promotion
function getCCNewDetailObject(){
  return {
    companyName: "",
    status: "",                 // ACTIVE, PENDING, EXPIRED, REDEEMED, COMPLETED        
    promoCategory: "",          // CREDIT, BANK, RETAIL
    offerType: "",              // OPENING, SPEND, DEPOSIT
    offerValue: null ,          // Reward or Savings amount
    beginDate: null,            // Account opening date, signup date, or promo begin date (default to today for non-signup bonus)
    expireDate: null,           // Last day to sign up or enroll for an offer
    expireEID: "",              // Calendar event id for reminder for signup or expire date
    endDate: null,              // Last day to complete activities required for offer
    firstDate: null,            // Date of first required Activity date
    endEID: "",                 // Calendar event id for last day to complete activities
    redemptionDate: null,       // Date offer was redeemed
    completionDate: null,       // Date that all required activities for offer were completed (applicable only for Bank or CC bonuses)
    creditDate: null,           // Date promo was offered (applicable only for Bank or CC bonuses)
    closeDate: null,            // Date to close the account
    closeEID:"",                // Calendar event id for reminder to close account
    thresholdAmt: null,         // Total Minimum Spend/Deposit Amount
    thresholdType: null,        // SINGLE, NET, MULTIPLE
    numReqAllowTxns: 1,         // The number of required or allowed transactions for offer
    minReqAmtPerTxn: 0,         // The spend/deposit amount needed for a transaction
    txnDetails:{                // Transactions (TXN) details history of deposits or spend requirments
      totalAmt:0,               // Total amount of all transactions (eg. for CREDIT OPENING this equals current spend)
      txnList: []               // List of transaction objexts, which will depend on type of promo
    },
    otherActivites:[],          // Additional list of activities and dates
    durationDays: "90",
    modDate: null,
  }
}

//A transaction activity record for the transaction list
function getTxnActivityObject(pName, pAmt){
  return {
      name:pName,
      completed: false,
      amt:pAmt,
      note:"",      
      date:"",      // For some reason using a null value as default, did not work when doing JSON parse, even though it should have
      type: "",
      EID: "",      //Notification EventID
      required: "", //True if required part of minNumTxns, false if additional added manually     
  }
}

function getActivePromoEventsModel(){
  const eventlist = [];   
  const data = new Object();

  const allUserCals = CalendarApp.getAllOwnedCalendars();
  for (const cal of allUserCals){
    console.log('[' + cal.getName() + ']');    

    if (cal.getName() == 'Promo Tracker'){
      const calEvents = cal.getEventsForDay(new Date());

      for (const event of calEvents){
        const promoEventModel = convertCalendarEventToPromoModelEvent(event);

        eventlist.push(promoEventModel);
        console.log("getActivePromoEventsModel()");
        console.log(promoEventModel) ;
      }

      data.events = eventlist;
      data.id = cal.getId();
    }    
  }

  return data;
}

//Creates a Promo Event Vue Model from Google Calendar Event
function convertCalendarEventToPromoModelEvent(event){
    const description = event.getDescription();
    if (description.length > 0 && description.indexOf('{') >= 0){
        dString = description;
        dString = dString.substring(dString.indexOf('{'),dString.lastIndexOf('}')+1).trim();
        console.log("convertCalendarEventToPromoModelEvent()");
        console.log("Promo Description String:" + dString);
    }

    const details = getCCNewDetailObject();
    util_copyObject(JSON.parse(dString),details);
    
    details.id = event.getId();
    details.summary = event.getSummary();
    
    details.start = util_formatTime(event.getStartTime());
    details.end   = util_formatTime(event.getEndTime());

    //Added this to avoid UTC timezone issue with stringify, may not need this date
    details.date  = util_getDateString(event.getStartTime());

    return details;
}

function updatePromo(promoCalId, promoEvent){
  //TODO: Not sure if it is better to just get original information from the calendar event, 
  //instead of passing in via the promoEvent object.
  const originalPromo = getCCNewDetailObject();
  util_copyObject(promoEvent.original,originalPromo);

  const updatedPromo = getCCNewDetailObject();
  util_copyObject(promoEvent.input,updatedPromo);

  console.log("Update Promo Called (Not Yet Implemented)");
  console.log("Original Promo: " + JSON.stringify(originalPromo));
  console.log("Updated Promo: " + JSON.stringify(updatedPromo));
}

function updatePromoDetails(promoCalId, promoEvent){
  console.log(`Promo Calendar ID: ${promoCalId}`);
  console.log(JSON.stringify(promoEvent));

  const details = getCCNewDetailObject();
  util_copyObject(promoEvent,details);

  //set mod date to today
  details.modDate = new Date();
  
  console.log(JSON.stringify(details));

  const cal = CalendarApp.getCalendarById(promoCalId);
  const event = cal.getEventById(promoEvent.id);
  console.log(event.getTitle());
  event.setDescription(JSON.stringify(details));
   
}


function deletePromotion(promoCalId, promoEvent){
  console.log(`Promo Calendar ID: ${promoCalId}`);
  console.log(JSON.stringify(promoEvent));

  const cal = CalendarApp.getCalendarById(promoCalId);
  const event = cal.getEventById(promoEvent.id);
 
  //TODO: Go through all notification calendar events and delete them as well
  event.deleteEvent();

  console.log(event.getTitle() + " Promotion Deleted");   
}

