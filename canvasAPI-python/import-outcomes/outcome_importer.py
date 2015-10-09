#!/usr/bin/env python
#################################################
#Author: Matt Lewis
#Department: Instructional Technology
#Institution: Eastern Washington University
##################################################
################## DESCRIPTION ###################
##################################################
#This code is used to upload new outcomes into Canvas at an account level. Data from an uploaded csv file is used to add a new outcome group if needed, as well
#as update or add the settings for an outcome. Only one rating scale can be used for each file being uploaded.

#This is a heavily modified version of kajiagga's outcome importer (https://github.com/kajigga/canvas-contrib/tree/master/API_Examples/import_outcomes/python).
#kept the access to csv files through kajiagga's functions, rewrote most of the logic on process for searching, adding, updating outcomes
#modifided the kajiagga csv file: added columns for account_id and outcome group vendor, renamed other fields and removed parent_id field

##################################################
################### CSV FILE #####################
##################################################
#You will need to format a csv file 
#Required Header Field Namess:'account_id','outcome_group_id','outcome_gropu_vendor_guid','outcome_id','outcome_vendor_guid','outcome_group_id','title','description','calculation_method','calculation_int','mastery_points'
#At the end of the header row add the rating scale title that will be used for this set of outcomes. For example 'Exceeds Expectations', 'Mets Expectations', 'Does Not Met Expectations'
#The point values for each rating are place in the data row under each outcome scale title.
#Note that for eace csv file, only one rating scale can be used.
##################################################
################## DIRECTIONS ####################
##################################################
# DIRECTIONS: Edit the below variable to match your institution's Canvas domain
domain = "enter your domain here"

##################################################
########## DO NOT EDIT BELOW THIS LINE ###########
##################################################


import requests
import json
import argparse
import sys,os
import csv
import pprint


##################################################

###########################################################################   
############################ FUNCTIONS ####################################
########################################################################### 
def get_headers():
  return {'Authorization': 'Bearer %s' % token}

###########################################################################
def checkFileReturnCSVReader(file_name):
  if file_name and os.path.exists(file_name):
    return csv.reader(open(file_name,'rU'))
  else:
    return None

###########################################################################
def getRootOutcomeGroup(apiType):
  url = "https://%s/api/v1/%s/root_outcome_group" % (domain,apiType)
  print(url)
  return requests.get(url,headers=get_headers(),verify=False).json()

###########################################################################
def paginated_outcome_groups(outcome,apiType):
  # Get outcome subgroups (this needs to walk)
  groupOutcomeList = []
  all_done = False
  url = 'https://%s/api/v1/%s/outcome_groups' % (domain,apiType)
  while not all_done:
    response = requests.get(url,headers=get_headers())
    if not response.json():
      #yield []
      return
    else:
      for s in response.json():
        groupOutcomeList.append(s)
    if 'next' in response.links:
      url = response.links['next']['url']
    else:
      all_done = True
    return groupOutcomeList
###########################################################################
def paginated_outcomes(outcomeGroupList,apiType):
    outcomeList = []
  # Get outcome subgroups (this needs to walk)
    for groups in outcomeGroupList:
        all_done = False
        url = 'https://%s/api/v1/%s/outcome_groups/%d/outcomes' % (domain,apiType,groups['id'])
        while not all_done:
            response = requests.get(url,headers=get_headers())
            if not response.json():
                #yield []
                return
            else:
                for s in response.json():
                    outcomeList['outcome_groups'].append(s)
            if 'next' in response.links:
                url = response.links['next']['url']
            else:
                all_done = True
    return outcomeList 
###########################################################################
def setOutcomeURL(outcome, outcomeGroupList, outcomeList, rootOutcomeGroupID, apiType):
    outcome_vendor_guid = outcome['outcome_vendor_guid']
    outcome_group_vendor_guid = outcome['outcome_group_vendor_guid']
    outcome_id = outcome['outcome_id']
    outcome_group_id = outcome['outcome_group_id']

    foundOutcome = False
        
    #search for the manually created outcome vendor_guid.  If found then use that outcome id within url to update outcome
    if outcome_vendor_guid != "":
        for outcomeItem in outcomeList:
            if outcome_vendor_guid == outcomeItem['vendor_guid']:
                foundOutcome = True
                url = 'https://%s/api/v1/%s/outcome_groups/%s/outcomes' % (domain,apiType,outcomeItem['id'])
                return url
                exit
                
    #if search for vendor_guid fails, search with outcome_id.  If found then use that outcome id within url to update outcome
    if outcome_id != "":
        for outcomeItem in outcomeList:
            if outcome_id == outcomeItem['id']:
                foundOutcome = True
                url = 'https://%s/api/v1/%s/outcome_groups/%s/outcomes' % (domain,apiType,outcomeItem['id'])
                return url
                exit
                
    #search for the manually created outcome group vendor_guid.  If found then use that outcome id within url to update outcome
    if outcome_group_id != " ":
        for group in outcomeGroupList:
            if outcome_group_vendor_guid == group['vendor_guid']:
                foundOutcome = True
                url = 'https://%s/api/v1/%s/outcome_groups/%s/outcomes' % (domain,apiType,group['id'])
                return url
                exit
                
    #if search for vendor_guid and outcome_id fails, search to find which outcome group the new outcome should be added to.
    #If found then use that outcome group id with account id to create new outcome
    if outcome_group_id != "":
        for group in outcomeGroupList:
            if outcome_group_id == group['id']:
                foundGroup = True
                url = 'https://%s/api/v1/%s/outcome_groups/%s/outcomes' % (domain,apiType,group['id'])
                return url
                exit
                
    #if no group or id is found, use the root group as the default location.
    url = 'https://%s/api/v1/%s/outcome_groups/%s/outcomes' % (domain,apiType,rootOutcomeGroupID)
    return url

###########################################################################
def findGroup(outcome_group_id, outcomeGroupList):
    foundGroup = False
    if not outcome_group_id:
        for group in outcomeGroupList:
            if outcome_group_id == group['id']:
                foundGroup = True
    return foundGroup

###########################################################################
def addGroup(outcomeGroup_vendor_guid,apiType):
    headers = {'Authorization':'Bearer %s'%token,'Content-Type':'application/json'}
    title = outcomeGroup_vendor_guid
    vendor_guid = outcomeGroup_vendor_guid
    parentid = rootOutcomeGroup['id']
    url = 'https://%s/api/v1/%s/outcome_groups/%d/subgroups' % (domain,apiType,parentid)
    print(url)
    params = {'title':title,'description': '','vendor_guid':vendor_guid, 'parent_outcome_group_id': parentid}
    r=requests.post(url,data=json.dumps(params),headers=headers)
    return r.status_code
###########################################################################
def enterOutcome(outcome, url):
    headers = {'Authorization':'Bearer %s'%token,'Content-Type':'application/json'}
    title = outcome['title']
    description = outcome['description']
    mastery_points = outcome['mastery_points']
    ratings = outcome['ratings']
    calculation_method = outcome['calculation_method']
    vendor_guid = outcome['outcome_vendor_guid'] 
    params = {'title':title,'description':description,'mastery_points': mastery_points,'ratings':ratings, 'calculation_method': calculation_method, 'vendor_guid': vendor_guid}
    r=requests.post(url,data=json.dumps(params),headers=headers)
    return r.status_code

###########################################################################   
###########################################################################
###########################################################################  
    

# Prepare argument parsing
parser = argparse.ArgumentParser()
parser.add_argument('--outcomesfile',required=True,help='path to the outcomes.csv file')

courses = input('Are these outcomes to be added to a course? (Y,N)')
if courses == 'Y':
  course_id = input('Enter Canvas Course ID (required field):')
  if not course_id:
    course_id = input('Canvas Course ID is a required field:')

token = input('Canvas Token:')
if not token:
  token = input('Canvas Token is a required field:')
if not token:
    print('#########################################################################')
    print('The Canvas Token is a required field.')
    print('Exiting script.')
    print('#########################################################################')
    exit()
  
#mark where in the csv file the rating scale column starts
rating_column=10
if __name__ == '__main__':
    args = parser.parse_args()
    outcomes_file = checkFileReturnCSVReader(args.outcomesfile)
    if outcomes_file :
      outcomes = {}
      outcome_data = {}
      for outcome_row in outcomes_file:
        
        if outcome_row[0]=="account_id":
          # add the rating scale titles from the csv header row into a rating_levels array
          outcome_data['rating_levels'] = outcome_row[rating_column:]
        else:
          #set field names array - matching csv header row up to ratings
          fields = ['account_id','outcome_group_id','outcome_group_vendor_guid','outcome_id','outcome_vendor_guid','title','description','calculation_method','calculation_int','mastery_points']
          
          #collect from csv header the outcome rating names
          #collect from row the value for those rating names
          #combine names and values into an array with the necissary Canvas titles (description, points), and add list to outcome array
          outcome = dict(zip(fields,outcome_row[:rating_column]))
          outcome.update({'ratings': list()})
          combo = dict(zip(outcome_data.get('rating_levels'),outcome_row[rating_column:]))
          outcome['ratings']=[]
          for key in combo:
            outcome['ratings'].append({'description': key, 'points': combo[key]})
          
          #Since this script can be used to add outcomes into the course as well as at the account level,
          #set the api type for use within the url of the api call.
          if courses == 'Y':
            apiType = 'courses/' + course_id
          else:
            apiType = 'accounts/' + outcome['account_id']
            
          #set the root group id
          rootOutcomeGroup = getRootOutcomeGroup(apiType)
          
          #create a full list of outcome groups in account
          outcomeGroupList = paginated_outcome_groups(outcome,apiType)
          
          #create a full list of outcomes in account
          outcomeList = paginated_outcome_groups(outcome,apiType)
          
          
          #find if the group ID is in full group list array, create group if needed
          if findGroup(outcome['outcome_group_id'], outcomeGroupList) == False:
            if outcome['outcome_group_vendor_guid'] != "":
              groupStatus = addGroup(outcome['outcome_group_vendor_guid'],apiType)
              #reset array of outcome groups to include newly added group, this array is used to determine the correct url for the API call
              outcomeGroupList = paginated_outcome_groups(outcome,apiType)
            else:
                print('############################ NOTE #######################################')
                print('No outcome group vendor guid found in csv')
                print('In order to add a new group, a group vendor id is required in the csv file')
                print('Outcome is being added to the root level.')
                print('#########################################################################')


          #set the url to create outcome
          url = setOutcomeURL(outcome, outcomeGroupList, outcomeList, rootOutcomeGroup['id'], apiType)
          print(url)
          #create or update outcome 
          outcomeStatus =enterOutcome(outcome, url)
          
          print('#########################################################################')
          if outcomeStatus == 200:
            print('Created outcome for:',outcome['title'])
          else:
            print('Error', outcomeStatus, 'occured on the creation of the Outcome:', outcome['title'],' ',outcome['description'])
          print('#########################################################################')

