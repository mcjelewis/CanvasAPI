
#################################################
Author: Matt Lewis  
Department: Instructional Technology  
Institution: Eastern Washington University

##################################################
## DESCRIPTION
##################################################
This code is used to upload new outcomes into Canvas at an account level. Data from an uploaded csv file is used to add a new outcome group if needed, as well as update or add the settings for an outcome. Only one rating scale can be used for each file being uploaded.

This is a heavily modified version of kajiagga's [outcome importer](https://github.com/kajigga/canvas-contrib/tree/master/API_Examples/import_outcomes/python). Kept the access to csv files through kajiagga's functions, rewrote most of the logic on process for searching, adding, updating outcomes modifided the kajiagga csv file: added columns for account_id and outcome group vendor, renamed other fields and removed parent_id field

##################################################
## CSV FILE
##################################################
*Required Header *   
>  Field Names:'account_id','outcome_group_id','outcome_gropu_vendor_guid','outcome_id','outcome_vendor_guid','outcome_group_id','title','description','calculation_method','calculation_int','mastery_points'  

At the end of the header row add the rating scale title that will be used for this set of outcomes. For example 'Exceeds Expectations', 'Mets Expectations', 'Does Not Met Expectations'  

The point values for each rating are placed in the data row under each outcome scale title.   

Note that for eace csv file, only one rating scale can be used.  


##################################################
## CUSTOMISE SCRIPT
##################################################
Edit the domain variable on line 28 to match your institution Canvas domain  
domain = "enter your domain here"

##################################################
##RUN SCRIPT
##################################################
For those unfamilar with how to run a python script, Python Central has a good article (http://pythoncentral.io/execute-python-script-file-shell/) that might help you get started.

This script has a required argument for the path of the csv file (--outcomesfile). Once the script runs, it will ask if the outcomes are for a specific course. If yes, it will then ask for the Canvas course id.

*Example Command*  
>  #! python [path to file]/outcome_imprter.py --outcomesfile [path to csv file]
