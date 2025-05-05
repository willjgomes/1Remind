// Input:   String in yyyy-mm-dd or yyyy/mm/dd format
// Returns: JS Date Object
function util_parseDate(dateStr){
    //TODO: Find better way to parse date, this feels hacky
    year = +dateStr.substring(0, 4);
    month = +dateStr.substring(5, 7);
    day = +dateStr.substring(8, 10);
    //throw Error(year + " " + month + " " + day + " " + eDate);

    return new Date(year, month - 1, day);
}

function util_formatTime(date){
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleString('en-US', options);
}

// Input:   JS Date Object
// Returns: String in yyyy-mm-dd
function util_getDateString(date){
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  
  const formattedDate = date.toLocaleDateString('en-US', options);

  return formattedDate;
}

function util_copyObject(source, target){
  for (const key of Object.keys(source)) {
      if (key in target) {
          target[key] = source[key];
      }
  }
}