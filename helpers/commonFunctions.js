var logger = require("./logger").Logger;

module.exports = {
  getOtpNumber,
  getCacheKey,
  GetUserRoleId,
  GetUserRole,
  logErrorMsg,
  GetMonthNumber,
  GetMonthName,
  logInfoMsg,
  // logDebugMsg,
  randomText
};

function getOtpNumber() {
  const num = [];
  const dt = new Date();
  num.push(dt.getMinutes());
  num.push(dt.getSeconds());
  num.push(Math.floor(Math.random() * 100 + 1));

  return num.toString().replace(/,/g, "");
}

function getCacheKey(tableName) {
  return "cache" + tableName;
}

function GetUserRoleId(roleName) {
  switch (roleName) {
    case "Administrator":
      return 1;
    case "BranchHead":
        return 2;
    case "Driver":
      return 3;
    case "Student":
      return 4;
    default:
      return 0;
  }
}

function GetUserRole(id) {
  switch (id) {
    case 1:
      return "Administrator";
    case 2:
      return "BranchHead";
    case 3:
      return "Driver";
    case 4:
      return "Student";
    default:
      return "Anonymus";
  }
}

function GetMonthNumber(monthName) {
  switch (monthName) {
    case "January":
      return 1;
    case "February":
      return 2;
    case "March":
      return 3;
    case "April":
      return 4;
    case "May":
      return 5;
    case "June":
      return 6;
    case "July":
      return 7;
    case "August":
      return 8;
    case "September":
      return 9;
    case "October":
      return 10;
    case "November":
      return 11;
    case "December":
      return 12;
    default:
      return 0;
  }
}

function GetMonthName(monthNo) {
  switch (monthNo) {
    case 1:
      return "January";
    case 2:
      return "February";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
    default:
      return '';
  }
}

async function logErrorMsg(fn, req, err) {
  if (req && req.params) {
    logger.Error("Request Params- " + JSON.stringify(req.params));
  }
  if (req && req.body) {
    logger.Error("Request Payload- " + JSON.stringify(req.body));
  }
  
  logger.Error("Error in function " + fn + ". Error message- " + JSON.stringify(err, null, 2));
}

async function logInfoMsg(msg) {
  logger.Info(msg);
}

// async function logDebugMsg(msg) {
//   logger.Debug(msg);
// }

function randomText(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}