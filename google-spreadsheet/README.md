
#CanvasAPI

Download data from the Canvas API into Google Spreadsheet.   

The Google Script will take the entered input (Canvas Token, Account Number, Course Number, Discussion Number, User Number), search the Canvas API, then enter the returned json data into a worksheet. 

This is a work is progress with immediate need dictating the direction and amount of time being put into this project.

My intention is not to keep this up to date with my current file.  Please contact me if you'd like an updated version or if you have any other questions.

##SET UP  
    1. Create a copy of the Google Spreadsheet from https://goo.gl/ODb4cQ
    2. Double check the sharing permissions, because next step is to add your Canvas token directly into the document!
    3. Enter your Canvas Token in the appropriate field in the spreadsheet, enter the type of report, and Course, Account, or Discussion numbers.  
    4. Select Canvas->Import Data from the Google spreadsheet menu.  

##GS
I've included the google script file so you can see what is happening with the Canvas API calls.
