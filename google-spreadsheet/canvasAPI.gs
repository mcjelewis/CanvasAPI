// The onOpen function is executed automatically every time a Spreadsheet is opened.
// Adds the menue item 'Import Data' that will call the API.
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries = [];
  // When the user selects "addMenuExample" menu, and clicks "Menu Entry 1", the function function1 is executed.
  menuEntries.push(
    {name: "Import Course Enrollments", functionName: "getCanvasCourseEnrollments"},
    {name: "Import Course Assignments", functionName: "getCanvasCourseAssignments"},
    {name: "Import Course Assignment Settings", functionName: "getCanvasCourseAssignmentSettings"},
    {name: "Import Course Assignment Groups", functionName: "getCanvasCourseAssignmentGroups"},
    {name: "Import Grades", functionName: "getCanvasGrades"},
    {name: "Extract Discussion Posts", functionName: "getCanvasDiscussionEdges"},
    {name: "Import Discussion Topic List", functionName: "getCanvasDiscussionTopics"},
    {name: "Import Term Data", functionName: "getCanvasTerms"},
    {name: "Refresh Terms", functionName: "refreshCanvasTerms"},
    {name: "Quiz List", functionName: "getQuizList"},
    {name: "Quiz Data", functionName: "getQuizData"},
    {name: "Sandbox", functionName: "apiCanvasSandbox"},
    {name: "Sandbox-GradeLog", functionName: "apiCanvasSandboxGradeLog"}
  );
  ss.addMenu("Canvas", menuEntries);

}

function callAPI(url){
  //Call API Data and convert to json object
  //REQUIRED:
  //  url = the full api url with token encluded.
  var jsonRaw = UrlFetchApp.fetch(url);
  var jsonString = jsonRaw.getContentText();
  var jsonObject = Utilities.jsonParse(jsonString);
  //var jsonObject = JSON.parse(jsonString);
  return jsonObject;
}

//Modified from Martin Hawksey's Canvas call: https://gist.github.com/mhawksey/5048249
function callCanvasAPI(domain, type, id, call, token, optPerPage){
  var perpage = (optPerPage != undefined) ? "&per_page="+optPerPage : "";
  var resp = {};
  var url = "https://"+domain+"/api/v1/"+type+"/"+id+"/"+call+"?access_token="+token+perpage;

  //Browser.msgBox(url);
  
  var result = UrlFetchApp.fetch(url);
  //Browser.msgBox(result);
  if (result.getResponseCode() == 200){
    var header = result.getHeaders();
    if (header.Link) {
      resp.linkHeader = parseLinkHeader(header.Link).rels;
    }
    resp.result = JSON.parse(result.getContentText());
    resp.responseCode = 200;
  } else {
    resp.responseCode = result.getResponseCode();
  }
  var x = Utilities.jsonParse(result.getContentText());
  //Browser.msgBox(x);
  return resp;
}
 
function stripHTML(string){
  var regex = /(<([^>]+)>)/ig;
  return string.replace(regex, "");
}
 
//Modified from Martin Hawksey's Canvas call: https://gist.github.com/mhawksey/5048249
function callAPIalternate(domain, type, id, call, token, optPerPage){
  var perpage = (optPerPage != undefined) ? "&per_page="+optPerPage : "";
  var resp = {};
  var url = "https://"+domain+"/"+type+"/"+id+"/"+call+"?access_token="+token+perpage;

  Browser.msgBox(url);
  
  var result = UrlFetchApp.fetch(url);
  //Browser.msgBox(result);
  if (result.getResponseCode() == 200){
    var header = result.getHeaders();
    if (header.Link) {
      resp.linkHeader = parseLinkHeader(header.Link).rels;
    }
    resp.result = JSON.parse(result.getContentText());
    resp.responseCode = 200;
  } else {
    resp.responseCode = result.getResponseCode();
  }
  var x = Utilities.jsonParse(result.getContentText());
  //Browser.msgBox(x);
  return resp;
}
 
function stripHTML(string){
  var regex = /(<([^>]+)>)/ig;
  return string.replace(regex, "");
}

//Find the number of the last row of data, return the first empty row
function findLastRow(sheetName) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName(sheetName);
  var rowNum = sheet.getLastRow();
  //var rowNum = SpreadsheetApp.getActiveSheet().getLastRow();
  return rowNum +1;
}

//Find the number of the last row of data from a specific column, return the first empty row
//REQUIRED:
//  sheetNum = the sheet number to start search.
//  col = the column to find the last row in.
function findLastRowByCol(sheetName, col) {
  //var ss = SpreadsheetApp.getActiveSpreadsheet();
  //var sheet = SpreadsheetApp.setActiveSheet(ss.getSheets()[sheetNum]);
  
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName(sheetName);
  var rowNum = sheet.getLastRow();
  //create an array of values in the column of the max range of rows
  var rows = sheet.getRange(1, col, rowNum).getValues();
  //find the row with the last value scaling up the column starting from the last row in sheet
    for( var i = (rowNum - 1) ; i > 0; i--){
      if( rows[i][0] !== "") {
        break;
      };
    };
    return i +2;
}

function getSettings(){
  //create a sheet with a name
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.setActiveSheet(ss.getSheets()[0]);
  var sheet = SpreadsheetApp.getActiveSheet();
  
  ////////////////////////////////////////////////
  //Setting Variables
 //var domain = "canvas.ewu.edu";
 //var domain = "ewu.beta.instructure.com";
  var domain = sheet.getRange(24,1).getValue()
  var token = sheet.getRange(3,1).getValue();
  var courseNum =  sheet.getRange(6,1).getValue();
  var termNum = sheet.getRange(9,1).getValue();
  var accountNum = sheet.getRange(12,1).getValue();
  var userNum = sheet.getRange(15,1).getValue();
  var discussionNum = sheet.getRange(18,1).getValue();
  var reportNum = sheet.getRange(21,1).getValue();
  var startCell = sheet.getRange(27,1).getValue();
  var endCell = sheet.getRange(27,2).getValue();
  var dataCallDate = new Date();
  var assignmentNum = sheet.getRange(30,1).getValue();
    ////////////////////////////////////////////////
  //enter date into 'credentials' worksheet
  sheet.getRange(6,3).setValue(dataCallDate);
  var dateRow = findLastRowByCol("credentials",3);
  sheet.getRange(dateRow,3).setValue(dataCallDate);
  ////////////////////////////////////////////////
  var arrSettings = {"domain": domain, "token": token,"courseNum": courseNum,"termNum": termNum,"accountNum":accountNum,"userNum": userNum,"discussionNum": discussionNum,"reportNum": reportNum,"dataCallDate": dataCallDate, "startCell": startCell,"endCell": endCell, "assignmentNum": assignmentNum};
  
  return arrSettings;
}

function refreshCanvasTerms(){
  var arrSettings = getSettings();
                             
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SpreadsheetApp.setActiveSheet(ss.getSheets()[0]);
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var accountNum =  arrSettings['accountNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  var row = 2;
  var termList = callCanvasAPI(domain, "accounts", accountNum, "terms", token, 50);

  for (i in termList.result.enrollment_terms){
    var term = termList.result.enrollment_terms[i];
    row = row+1;
    var termName = term.name;
    var termID = term.id;
    var displayTerm = termName+" = "+termID;
    sheet.getRange(row,4).setValue(displayTerm);
  }
}

function json2Sheet(arrHeaders, jsonObject, jsonLength, sheetName, dataType, dataTypeValue, dataCallDate) {  
//This function will take the JSON object and convert it to a sheet in a spreadsheet.
//REQUIRED:
//  arrHeaders = array of the property names that are to be pulled out of the JSON object.
//               In order to get sub level properties the a single variable needs to be added to the array with the property values seperated by a period.
//               EXAMPLE: {0: "user.name", 1: "user_id", 2: "grades.current_score", 3: "grades.final_score"};
//                 Note - "user.name", the "." shows the divid of a sublevel of data in JSON.
//  jsonObject = the JSON object.
//  jsonLength = the number of records in the JSON object.
//  sheetNum = the spreadsheet sheet number where the data is to be added.
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var i = 0;
    //open the correct sheet for data set as active
    //SpreadsheetApp.setActiveSheet(ss.getSheets()[sheetNum]);
    //var sheet = SpreadsheetApp.getActiveSheet();
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName(sheetName);
  
    //clear sheet data
    //sheet.clear();
    //var startRow = findLastRowbyCol(sheetNum,1);
    var startRow = findLastRow(sheetName);
    var rowNum = startRow;
    if(rowNum == 1) rowNum=2;

  //testing data imput
  //jsonLength=1;
      //sheet.getRange(1, 1).setValue(jsonObject);
  if(jsonLength == null) jsonLength=1;
    //loop through json object setting raw data into first row
    for(i = 0; i<jsonLength; i++){
      //add the header title for the first two columns.  Every worksheet should start with 'timestamp' and 'json'
      //check to see if head is already created
      var headerCol1 = sheet.getRange(1,1).getValue();
      //if (headerCol1 !=""){
        sheet.getRange(1,1).setValue('timestamp');
        sheet.getRange(1,2).setValue('json');
        sheet.getRange(1,3).setValue(dataType);
      //}
      //add a timestamp for each row along with the json object
      if(jsonLength > 1){
         var dataCell = jsonObject[i];
      }else{
        var dataCell = jsonObject;
      }
      sheet.getRange(rowNum, 1).setValue(dataCallDate);
      sheet.getRange(rowNum, 2).setValue(dataCell);
      sheet.getRange(rowNum,3).setValue(dataTypeValue);
      
      //add one to rowNum to set next empty row
      rowNum++;
  //testing data imput
     // sheet.getRange(1, 1).setValue(jsonLength);
    }
    //loop through json object creating columns designated from the header array.
    var h=0;
    var cellRow = startRow;
    if(cellRow==0) cellRow=1;
  
  for(var key in arrHeaders){
       var keyCount = 0;
       var arrheaderKey = arrHeaders[h];
      //skip the first two columns reserved for timestamp and json
       var headerCol = h + 4;
       //Split header at "." to capture sublevel properties (i.e. grades.final_score) and count of items used to iterate over.
       var headerKey = arrheaderKey.split(".");
       keyCount = arrheaderKey.split(".").length;
       
       for(i = 0; i<jsonLength; i++){
         //check if header needs to be added
         var headerColValue = sheet.getRange(1, headerCol).getValue();
         if(jsonLength==1) jsonObject[0]=jsonObject;
         if (headerColValue != arrheaderKey){
            sheet.getRange(1, headerCol).setValue(arrheaderKey);
           //move pointer to the next row for first data records
            if(cellRow==1)cellRow++;
          }
          
          //Using the header array values can be found two levels deep, but will error out with anything deeper.
          if (keyCount == 1){
            if(typeof jsonObject[i][arrheaderKey] != "undefined"){
              var value = jsonObject[i][arrheaderKey];
            }else{
              var value = "retrieval error";
            }
          }else if (keyCount == 2){
            var key1 = headerKey[0];
            var key2 = headerKey[1];
            //check to make sure that the lead property is defined in the JSON object
            //grab value from json object
            //if((typeof jsonObject[i][key1] != "undefined") || (typeof jsonObject[i][key1][key2] != "undefined")){
            if(typeof jsonObject[i][key1] != "undefined"){
              var value = jsonObject[i][key1][key2];
            }else{
              var value = "retrieval error";
            }
          }else if (keyCount == 3){
            var key1 = headerKey[0];
            var key2 = headerKey[1];
            var key3 = headerKey[2];
            //check to make sure that the lead property is defined in the JSON object
            //grab value from json object
            //if((typeof jsonObject[i][key1] != "undefined") || (typeof jsonObject[i][key1][key2] != "undefined") || (typeof jsonObject[i][key1][key2][key3] != "undefined")){  
            if(typeof jsonObject[i][key1][key2] != "undefined"){
              var value = jsonObject[i][key1][key2][key3];
            }else{
              var value = "retrieval error";
            }
         }else{
            var value = "retrieval error";
         }
         
         sheet.getRange(cellRow, headerCol).setValue(value);
         cellRow++;
       }
      //move to the next column
       h++;
      //reset row back to start and bypass the header row if needed
      cellRow = startRow;
      if(cellRow==0) cellRow=2;
      
    }

}


function getCanvasCourseEnrollments(){
  
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  
  //create json data object
  var jsonEnrollment = callCanvasAPI(domain, "courses", courseNum, "enrollments", token, 100);
  //var jsonRecent = callCanvasAPI(domain, "courses", courseNum, "recent_students", token, 100);
 
  //Set Headers
  var enrollmentHeaders = {0: "id", 1: "user.sortable_name", 2: "user_id", 3:"user.login_id", 4: "user.sis_user_id", 5:"role", 6: "total_activity_time", 7: "last_activity_at", 8: "grades.current_score", 9: "grades.final_score"};
 // var recentHeaders = {0: "name", 1: "id", 2: "last_login"};

   //count records in data
   var enrollmentLength = jsonEnrollment.result.length;
   //var recentLength = jsonRecent.result.length;
    
   json2Sheet(enrollmentHeaders, jsonEnrollment.result, enrollmentLength, 'enrollments', 'courseid', courseNum, dataCallDate);
   //json2Sheet(recentHeaders, jsonRecent.result, recentLength, 'activity', 'courseid', courseNum, dataCallDate);
  //Additional assignment settings
  //https://canvas.ewu.edu/api/v1/courses/834960/assignments/2215625
  
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("enrollments");
  SpreadsheetApp.setActiveSheet(sheet);
}

function getCanvasCourseAssignments(){
  
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  
  //create json data object
  var jsonAssignment = callCanvasAPI(domain, "courses", courseNum, "analytics/assignments", token, 100);
   
  //Set Headers
  var assignmentHeaders = {0: "assignment_id", 1: "title", 2: "points_possible", 3: "min_score", 4: "median", 5: "max_score", 6: "tardiness_breakdown.missing", 7: "tardiness_breakdown.late", 8: "tardiness_breakdown.on_time"};

   //count records in data
   var assignmentLength = jsonAssignment.result.length;

   json2Sheet(assignmentHeaders, jsonAssignment.result, assignmentLength, 'assignments', 'courseid', courseNum, dataCallDate);
  //Additional assignment settings
  //https://canvas.ewu.edu/api/v1/courses/834960/assignments/2215625
  
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("assignments");
  SpreadsheetApp.setActiveSheet(sheet);
  
}

function getCanvasCourseAssignmentSettings(){
  
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];

  
  //create json data object
  var jsonAssignmentList = callCanvasAPI(domain, "courses", courseNum, "/assignments", token, 100);
  
  //Set Headers
   var assignmentListHeaders = {0: "id", 1: "name", 2: "points_possible", 3: "submission_types", 4: "allowed_extensions", 5: "published", 6: "quiz_id", 7: "discussion_topic", 8: "has_submitted_submissions", 9: "use_rubric_for_grading", 10: "rubric", 11: "rubric.id", 12:"assignment_group_id"};
  //var assignmentListHeaders = {0: "assignment_id", 1: "title", 2: "points_possible", 3: "submission_type", 4: "published", 5: "quiz_id", 6: "discussion_topic", 7: "use_rubric_for_grading", 8: "rubric"};

   //count records in data
   var assignmentListLength = jsonAssignmentList.result.length;

   json2Sheet(assignmentListHeaders, jsonAssignmentList.result, assignmentListLength, 'assignment-settings', 'courseid', courseNum, dataCallDate);
      
   var doc = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = doc.getSheetByName("assignment-settings");
   SpreadsheetApp.setActiveSheet(sheet);

}


function getCanvasCourseAssignmentGroups(){
  
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];

  
  //create json data object
  var jsonAssignmentGroup = callCanvasAPI(domain, "courses", courseNum, "/assignment_groups", token, 100);

  //Set Headers
   var assignmentGroupHeaders = {0: "id", 1: "name", 2: "group_weight", 3: "rules.drop_lowest", 4: "rules.drop_highest", 5: "rules.never_drop"};

   //count records in data
   var assignmentGroupLength = jsonAssignmentGroup.result.length;

   json2Sheet(assignmentGroupHeaders, jsonAssignmentGroup.result, assignmentGroupLength, 'assignment-groups', 'courseid', courseNum, dataCallDate);
      
   var doc = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = doc.getSheetByName("assignment-groups");
   SpreadsheetApp.setActiveSheet(sheet);


}

function getCanvasGrades(){
  //Error setting is not done yet, this function works in conjunctions with the Enrollments sheets.
  //Before collecting grades, run the Enrollments function, then mark the start and end cells of the student
  //you want grades for.
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var startCell = arrSettings['startCell'];
  var endCell = arrSettings['endCell'];
  var dataCallDate =  arrSettings['dataCallDate'];
  
  var row=0;
  var len=0;
  var userid=0;
  var courseNum=0;
  var call;
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var role;
    
    
  for (row = startCell, len = endCell; row <= len; row++) {
    var sheet = doc.getSheetByName('enrollments');
    courseNum = sheet.getRange(row, 3).getValue();
    userid = sheet.getRange(row, 6).getValue();
    role = sheet.getRange(row, 9).getValue();
    
    //Browser.msgBox(courseNum);  
    if(role == "StudentEnrollment"){
      call = "analytics/users/" + userid + "/assignments";
  
      //create json data object
      var jsonGrades = callCanvasAPI(domain, "courses", courseNum, call, token, 100);
   
      //Set Headers
      var gradesHeaders = {0: "assignment_id", 1: "title", 2: "submission.submitted_at", 3: "submission.score", 4: "due_at", 5: "points_possible"};
  
      //count records in data
      var gradesLength = jsonGrades.result.length;
     
      var courseUserID = courseNum + "-" + userid;
    
      json2Sheet(gradesHeaders, jsonGrades.result, gradesLength, 'grades', 'courseid-userid', courseUserID, dataCallDate);
  
      var doc = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = doc.getSheetByName("grades");
      SpreadsheetApp.setActiveSheet(sheet);
    }
  }
}

function getCanvasTerms(){
  
  var arrSettings = getSettings();
                              
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var accountNum =  arrSettings['accountNum'];
  var termNum =  arrSettings['termNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  
  //create json data object
    var jsonReports = callCanvasAPI(domain, "accounts", accountNum, "analytics/terms/" + termNum + "/statistics", token, 100);
    var jsonReportsPageCategories = callCanvasAPI(domain, "accounts", accountNum, "analytics/terms/" + termNum + "/activity", token, 100);
    
  //Set Headers
  var reportsHeaders = {0: "media_objects", 1: "students", 2: "courses", 3: "attachments", 4: "assignments", 5: "discussion_topics", 6: "teachers"};
  var reportsPageCategoriesHeaders = {0: "category", 1: "views"};  
  
  //count records in data
    var reportsLength = jsonReports.result.length;
    var reportsPageCategoriesLength = jsonReportsPageCategories.result.by_category.length;
  
    var accountTermNum = accountNum+"-"+termNum;
    json2Sheet(reportsHeaders, jsonReports.result, reportsLength, 'term-accounts', 'account-term', accountTermNum, dataCallDate);
    json2Sheet(reportsPageCategoriesHeaders, jsonReportsPageCategories.result.by_category, reportsPageCategoriesLength, 'term-page-categories', 'account-term', accountTermNum, dataCallDate);
    
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("term-page-categories");
  SpreadsheetApp.setActiveSheet(sheet);
}

/*
Discussion Posts
The following functions were created by Martin Hawksey.  I've modified them to include a token and course number pulled from the credential sheet.
Github: https://gist.github.com/mhawksey/5048249
*/

function getCanvasDiscussionEdges() {
  
  var arrSettings = getSettings();
                             
  //var ss = SpreadsheetApp.getActiveSpreadsheet();
  //var sheet = SpreadsheetApp.setActiveSheet(ss.getSheets()[0]);
  
  var canvas = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var type = "courses";
  var id = courseNum;
  var output = [["courseNum", "assignment_id", "vert1_name","vert2_name","vert1_id","vert2_id","vert1_image_url","vert2_image_url","topic_id","topic_title","topic_url","created_at", "message_id", "message_text"]];
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("discussion");
  //var db = ScriptDb.getMyDb();
  var topicList = callCanvasAPI(canvas, type, id, "discussion_topics", token, 50);
  var participants = {}
  for (i in topicList.result){
    var topic = topicList.result[i];
    var assignment_id = topicList.result[i].assignment_id;
    var data = callCanvasAPI(canvas, type, id, "discussion_topics/"+topicList.result[i].id+"/view", token);
    var participant_data = data.result.participants;
    for (p in participant_data){
      participants[participant_data[p].id] = participant_data[p];
    }
    for (j in data.result.view){
      var view = data.result.view[j];
      if (!view.deleted){
        var vert1_name = participants[view.user_id].display_name;
        var vert2_name = topic.author.display_name;
        var vert1_id = view.user_id;
        var vert2_id = topic.author.id;
        var vert1_image_url = participants[view.user_id].avatar_image_url;
        var vert2_image_url = topic.author.avatar_image_url;
        var topic_id = topic.id;
        var topic_title = topic.title;
        var topic_url = topic.url;
        var topic_url = topic.url;
        var created_at = getDateFromIso(view.created_at);
        var message_id = view.id;
        output.push([courseNum, assignment_id, vert1_name, vert2_name, vert1_id, vert2_id, vert1_image_url, vert2_image_url, topic_id, topic_title, topic_url, created_at, message_id, stripHTML(view.message)]);
        output = output.concat(getReplies(view, participants, topic, courseNum, assignment_id));
      }
    }
  }
  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
//move to discussion worksheet
  SpreadsheetApp.setActiveSheet(sheet);
}
 
function getReplies(view, participants, topic, courseNum, assignment_id){
  var rows = [];
  if (!view.deleted){ 
    if (view.replies != undefined){
      for (r in view.replies){
        var reply = view.replies[r];
        if (!reply.deleted){
          var vert1_name = participants[reply.user_id].display_name;
          var vert2_name = participants[view.user_id].display_name;
          var vert1_id = reply.user_id;
          var vert2_id = view.user_id;
          var vert1_image_url = participants[reply.user_id].avatar_image_url;
          var vert2_image_url = participants[view.user_id].avatar_image_url;
          var topic_id = topic.id;
          var topic_title = topic.title;
          var topic_url = topic.url;
          var created_at = getDateFromIso(reply.created_at);
          var message_id = view.id;
          rows.push([courseNum, assignment_id, vert1_name, vert2_name, vert1_id, vert2_id, vert1_image_url, vert2_image_url, topic_id, topic_title, topic_url, created_at, message_id, stripHTML(reply.message)]);
          rows = rows.concat(getReplies(reply, participants, topic, courseNum, assignment_id));
        }
      }
    }
  }
  return rows;
}
 

// http://delete.me.uk/2005/03/iso8601.html
function getDateFromIso(string) {
  try{
    var aDate = new Date();
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));
 
    var offset = 0;
    var date = new Date(d[1], 0, 1);
 
    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= ((d[15] == '-') ? 1 : -1);
    }
 
    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    return new Date(aDate.setTime(Number(time)));
  } catch(e){
    return;
  }
}
 
 
// http://bill.burkecentral.com/2009/10/15/parsing-link-headers-with-javascript-and-java/
function parseLinkHeader(value) {
  var linkexp=/<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
  var paramexp=/[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;
  var matches = value.match(linkexp);
  var rels = new Object();
  var titles = new Object();
  for (i = 0; i < matches.length; i++)
  {
    var split = matches[i].split('>');
    var href = split[0].substring(1);
    var ps = split[1];
    var link = new Object();
    link.href = href;
    var s = ps.match(paramexp);
    for (j = 0; j < s.length; j++) {
      var p = s[j];
      var paramsplit = p.split('=');
      var name = paramsplit[0];
      link[name] = unquote(paramsplit[1]);
    }
    if (link.rel != undefined) {
      rels[link.rel] = link;
    }
    if (link.title != undefined)  {
      titles[link.title] = link;
    }
  }
  var linkheader = new Object();
  linkheader.rels = rels;
  linkheader.titles = titles;
  return linkheader;
}
 
function unquote(value) {
  if (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') return value.substring(1, value.length - 1);
  return value;
}
/*
END - Discussion Posts: Martin Hawksey

*/


function getCanvasDiscussionTopics(){
  
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  
  //create json data object
  var jsonTopic = callCanvasAPI(domain, "courses", courseNum, "discussion_topics", token, 100);
   
  //Set Headers
  var topicHeaders = {0: "assignment_id", 1: "id", 2: "title", 3: "assignment.discussion_topic_id", 4: "published", 5: "author.id", 6: "author.display_name", 7: "require_initial_post", 8: "discussion_type", 9: "assignment.points_possible", 10: "discussion_subentry_count", 11: "message"};

   //count records in data
   var topicLength = jsonTopic.result.length;

   json2Sheet(topicHeaders, jsonTopic.result, topicLength, 'discussion-topics', 'courseid', courseNum, dataCallDate);

  
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("discussion-topics");
  SpreadsheetApp.setActiveSheet(sheet);
}

///////////////////////////////////////////////////
///////////////////QUIZZES/////////////////////////
///////////////////////////////////////////////////

function getQuizList() {
  
  var arrSettings = getSettings();
  
  var canvas = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  var type = "courses";
  var output = [["timestamp","course","quiz_id","title", "allowed_attemps","assignment_id", "published"]];
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("quiz-list");
  var db = ScriptDb.getMyDb();
  var data = callCanvasAPI(canvas, type, courseNum, "quizzes", token, 50);
  for (i in data.result.view){
    var view = data.result.view[i];
    if (!view.deleted){
      var quiz_id = view.id;
      var atitle = view.title;
      var allowed_attemps = view.allowed_attemps;
      var assignment_id = view.assignment_id;
      var published = view.published;
      output.push([dataCallDate, courseNum, quiz_id, title, allowed_attemps, assignment_id, published]);
    }
  }
  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
  
//move to discussion worksheet
  SpreadsheetApp.setActiveSheet(sheet);
}






///////////////////////////////////////////////////
///////////////////SANDBOX/////////////////////////
///////////////////////////////////////////////////

function apiCanvasSandbox() {
  
  var arrSettings = getSettings();
  
  var canvas = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var type = "courses";
  var id = courseNum;
  var output = [["user_id", "role"]];
  
  var topicList = callCanvasAPI(canvas, type, id, "enrollments", token, 100);
  
  var participants = {}
  for (i in topicList.result){
    var topic = topicList.result[i];
    var userid = topicList.result[i].user_id;
    var role = topicList.result[i].role;
    
    //Browser.msgBox(courseNum);  
    if(role == "StudentEnrollment"){
    
      var call = "users/" + userid + "/usage.json";
  
      //create json data object
      var jsonAccess = callAPIalternate(canvas, "courses", courseNum, call, token, 100);
   
      //Set Headers
      var accessHeaders = {0: "asset_user_access.user_id", 1: "asset_user_access.readable_name", 2: "context_type", 3: "view_score", 4: "asset_user_access.last_access"};
  
      //count records in data
      var accessLength = jsonAccess.result.length;
     
    
      json2Sheet(accessHeaders, jsonAccess.result, accessLength, 'access', 'courseid', courseNum, dataCallDate);
  
      var doc = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = doc.getSheetByName("access");
      SpreadsheetApp.setActiveSheet(sheet);
    }
  }
}

function apiCanvasSandboxGradeLog() {
  
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var assignmentNum =  arrSettings['assignmentNum'];
  var userNum =  arrSettings['userNum'];
  var dataCallDate =  arrSettings['dataCallDate'];

var searchNum= "";
var search="";
var tabName="";
//https://canvas.ewu.edu/api/v1/audit/grade_change/students/3390045
//https://canvas.ewu.edu/api/v1/audit/grade_change/assignments/2458649
//https://canvas.ewu.edu/api/v1/audit/grade_change/courses/920945

if(courseNum != ""){
  search = "courses";
  searchNum = courseNum;
  tabName ="gradelog-course";
  }
if(assignmentNum != ""){
  search = "assignments";
  searchNum = assignmentNum;
  tabName ="gradelog-assignment";
  }
if(userNum != ""){
  search = "students";
  searchNum = userNum;
  tabName ="gradelog-student";
  }
  //create json data object
//page 2
//https://canvas.ewu.edu/api/v1/audit/grade_change/students/3390045?page=bookmark:WzE0MTM0MTc2MDAsIjE0MTM4MTk4MDBcL2JkZWI0MGUwIl0&per_page=100
//page 3
//https://canvas.ewu.edu/api/v1/audit/grade_change/students/3390045?page=bookmark:WzEzOTIyNDk2MDAsIjEzOTI0MDM1OTlcLzQzOTM0NzMwIl0&per_page=100

  //var jsonAssignmentList = callCanvasAPI(domain, "audit/grade_change", search, searchNum, token, "100&page=bookmark:WzEzOTIyNDk2MDAsIjEzOTI0MDM1OTlcLzQzOTM0NzMwIl0");
  
  //https://canvas.ewu.edu/api/v1/audit/grade_change/courses/942246?page=bookmark:WzE0MjM2OTkyMDAsIjE0MjQyODU4MDRcL2NlNjA5MjIwIl0&per_page=100
  //https://canvas.ewu.edu/api/v1/audit/grade_change/courses/942246?page=bookmark:WzE0MjM2OTkyMDAsIjE0MjQxOTk4NzdcL2JlMGM0NjUwIl0&per_page=100
  //https://canvas.ewu.edu/api/v1/audit/grade_change/courses/942246?page=bookmark:WzE0MjM2OTkyMDAsIjE0MjM3NjkyNzJcLzI5MDY1YjQwIl0&per_page=100
  
  var jsonAssignmentList = callCanvasAPI(domain, "audit/grade_change", search, searchNum, token, "100&page=bookmark:WzE0MjM2OTkyMDAsIjE0MjM3NjkyNzJcLzI5MDY1YjQwIl0");
  
  //Set Headers
   var assignmentListHeaders = {0: "version_number", 1: "created_at", 2: "grade_before", 3: "grade_after", 4: "links.student", 5: "links.assignment", 6: "links.course", 7: "links.grader", 8: "id", 9: "event_type"};

   //count records in data
   var assignmentListLength = jsonAssignmentList.result.events.length;

   json2Sheet(assignmentListHeaders, jsonAssignmentList.result.events, assignmentListLength, tabName, 'searchPattern', search+"="+searchNum, dataCallDate);
      
   var doc = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = doc.getSheetByName(tabName);
   SpreadsheetApp.setActiveSheet(sheet);
}





////////////////////////
///All Discussion Posts
///////////////////////

function getCanvasDiscussionTopics(){
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var arrSettings = getSettings();
  
  var domain = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var dataCallDate =  arrSettings['dataCallDate'];
  
  //create json data object
  var jsonTopic = callCanvasAPI(domain, "courses", courseNum, "discussion_topics", token, 100);
   
  //Set Headers
  var topicHeaders = {0: "assignment_id", 1: "id", 2: "title", 3: "assignment.discussion_topic_id", 4: "published", 5: "author.id", 6: "author.display_name", 7: "require_initial_post", 8: "discussion_type", 9: "assignment.points_possible", 10: "discussion_subentry_count", 11: "message"};

   //count records in data
   var topicLength = jsonTopic.result.length;

   json2Sheet(topicHeaders, jsonTopic.result, topicLength, 'discussion-topics', 'courseid', courseNum, dataCallDate);

  
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("discussion-topics");
  SpreadsheetApp.setActiveSheet(sheet);
  
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  var arrSettings = getSettings();
                             
  //var ss = SpreadsheetApp.getActiveSpreadsheet();
  //var sheet = SpreadsheetApp.setActiveSheet(ss.getSheets()[0]);
  
  var canvas = arrSettings['domain'];
  var token = arrSettings['token'];
  var courseNum =  arrSettings['courseNum'];
  var type = "courses";
  var id = courseNum;
  var output = [["courseNum", "assignment_id", "vert1_name","vert2_name","vert1_id","vert2_id","vert1_image_url","vert2_image_url","topic_id","topic_title","topic_url","created_at", "message_id", "message_text"]];
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName("discussion");
  //var db = ScriptDb.getMyDb();
  var topicList = callCanvasAPI(canvas, type, id, "discussion_topics", token, 50);
  var participants = {}
  for (i in topicList.result){
    var topic = topicList.result[i];
    var assignment_id = topicList.result[i].assignment_id;
    var data = callCanvasAPI(canvas, type, id, "discussion_topics/"+topicList.result[i].id+"/view", token);
    var participant_data = data.result.participants;
    for (p in participant_data){
      participants[participant_data[p].id] = participant_data[p];
    }
    for (j in data.result.view){
      var view = data.result.view[j];
      if (!view.deleted){
        var vert1_name = participants[view.user_id].display_name;
        var vert2_name = topic.author.display_name;
        var vert1_id = view.user_id;
        var vert2_id = topic.author.id;
        var vert1_image_url = participants[view.user_id].avatar_image_url;
        var vert2_image_url = topic.author.avatar_image_url;
        var topic_id = topic.id;
        var topic_title = topic.title;
        var topic_url = topic.url;
        var topic_url = topic.url;
        var created_at = getDateFromIso(view.created_at);
        var message_id = view.id;
        output.push([courseNum, assignment_id, vert1_name, vert2_name, vert1_id, vert2_id, vert1_image_url, vert2_image_url, topic_id, topic_title, topic_url, created_at, message_id, stripHTML(view.message)]);
        output = output.concat(getReplies(view, participants, topic, courseNum, assignment_id));
      }
    }
  }
  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
//move to discussion worksheet
  SpreadsheetApp.setActiveSheet(sheet);
}
 
function getReplies(view, participants, topic, courseNum, assignment_id){
  var rows = [];
  if (!view.deleted){ 
    if (view.replies != undefined){
      for (r in view.replies){
        var reply = view.replies[r];
        if (!reply.deleted){
          var vert1_name = participants[reply.user_id].display_name;
          var vert2_name = participants[view.user_id].display_name;
          var vert1_id = reply.user_id;
          var vert2_id = view.user_id;
          var vert1_image_url = participants[reply.user_id].avatar_image_url;
          var vert2_image_url = participants[view.user_id].avatar_image_url;
          var topic_id = topic.id;
          var topic_title = topic.title;
          var topic_url = topic.url;
          var created_at = getDateFromIso(reply.created_at);
          var message_id = view.id;
          rows.push([courseNum, assignment_id, vert1_name, vert2_name, vert1_id, vert2_id, vert1_image_url, vert2_image_url, topic_id, topic_title, topic_url, created_at, message_id, stripHTML(reply.message)]);
          rows = rows.concat(getReplies(reply, participants, topic, courseNum, assignment_id));
        }
      }
    }
  }
  return rows;
}
 

// http://delete.me.uk/2005/03/iso8601.html
function getDateFromIso(string) {
  try{
    var aDate = new Date();
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));
 
    var offset = 0;
    var date = new Date(d[1], 0, 1);
 
    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= ((d[15] == '-') ? 1 : -1);
    }
 
    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    return new Date(aDate.setTime(Number(time)));
  } catch(e){
    return;
  }
}
 
 
// http://bill.burkecentral.com/2009/10/15/parsing-link-headers-with-javascript-and-java/
function parseLinkHeader(value) {
  var linkexp=/<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
  var paramexp=/[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;
  var matches = value.match(linkexp);
  var rels = new Object();
  var titles = new Object();
  for (i = 0; i < matches.length; i++)
  {
    var split = matches[i].split('>');
    var href = split[0].substring(1);
    var ps = split[1];
    var link = new Object();
    link.href = href;
    var s = ps.match(paramexp);
    for (j = 0; j < s.length; j++) {
      var p = s[j];
      var paramsplit = p.split('=');
      var name = paramsplit[0];
      link[name] = unquote(paramsplit[1]);
    }
    if (link.rel != undefined) {
      rels[link.rel] = link;
    }
    if (link.title != undefined)  {
      titles[link.title] = link;
    }
  }
  var linkheader = new Object();
  linkheader.rels = rels;
  linkheader.titles = titles;
  return linkheader;
}
 
function unquote(value) {
  if (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') return value.substring(1, value.length - 1);
  return value;
}
/*
END - Discussion Posts: Martin Hawksey

*/