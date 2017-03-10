#!/usr/bin/env python
#################################################
#Author: Matt Lewis
#Department: Instructional Technology
#Institution: Eastern Washington University
##################################################
################## DESCRIPTION ###################
##################################################
#This code is used to collect the file submissions to assignments marked as using Turnitin for a specific term.
#Note that the Turnitin plugin must be made available to your account otherwise the turnitin data is hidden and is not shown in the API calls.

#This was a one off project, so once I got what I needed, I stopped working on it.  So my apologies for not
#commenting the code better.

#When this script is run:
#1. It will first ask for your Canvas Token ID.
#2. Next it will ask to enter the domain used for your Canvas instance.
#3. Next it will ask if you want to collect submissions from a specific course (good for testing)
#4. If question 3 is left blank, it will then ask if you'd like to display term ids (helpful if you don't know which term you want to run)
#5. If question 4 is yes, it will display a list of term names and id numbers for reference.
#6. Next it will ask you to 'Enter the Term ID'
#7. Next it will ask if you want to filter to a select sub-account


##################################################
################## DIRECTIONS ####################
##################################################
# DIRECTIONS: Edit the below variables to match your institution domain and your personal token
csvFileName = "Canvas-turnitin_submissions"
#add you folder path here for where you'd like the files saved:
folderPath1 = ""
#folderPath1 = "/Canvas-python/turnitin/submissions/"
hasData = False
##################################################
########## DO NOT EDIT BELOW THIS LINE ###########
##################################################


import requests
import simplejson as json
import urllib.request
#import urllib2
import argparse
import sys,os
import csv
import pprint
import os
import getpass

from timeit import default_timer as timer

start = timer()
callCount=0
fileCount=0
fileCountAll=0
##################################################

###########################################################################   
############################ FUNCTIONS ####################################
########################################################################### 
def get_headers():
  return {'Authorization': 'Bearer %s' % token}

###########################################################################
def flattenjson( b, delim ):
    val = {}
    for i in b.keys():
      if isinstance( b[i], dict ):
        get = flattenjson( b[i], delim )
        for j in get.keys():
          val[ i + delim + j ] = get[j]
      else:
        val[i] = b[i]

    return val
###########################################################################
def getRootID():
  url = "https://%s/api/v1/accounts?per_page=100" % (domain)
  print(url)
  response = requests.get(url,headers=get_headers())
  if not response.json():
    return "No Root"
  else:
    for s in response.json():
      if not s['root_account_id']:
        rootID = s['id']
      else:
        rootID = s['root_account_id']
  return rootID
###########################################################################
###########################################################################
def get_terms(accountID):
  termData=[]
  url = "https://%s/api/v1/accounts/%s/terms?per_page=100" % (domain, accountID)
  global callCount
  callCount += 1
  print(callCount, " url: ", url)
  response = requests.get(url,headers=get_headers())
  if not response.json():
    return "No Terms"
  else:
    json = response.json()
    #print(json['enrollment_terms'])
    for s in json['enrollment_terms']:
      termData.append({'term_id': s['id'], 'term_name': s['name']})
      
  return termData
###########################################################################
###########################################################################
def get_courses(account_id, termID):
  courseList=[]
  all_done = False
  print('account_id:', account_id)
  paginated_account_courses('', account_id, termID, courseList, all_done)
    
  return courseList
###########################################################################
def paginated_account_courses(url, account_id, termID, courseList, all_done):
  global callCount
  course_count=0
  if not url:
    url = 'https://%s/api/v1/accounts/%s/courses?include[]=storage_quota_used_mb&include[]=term&include[]=total_students&include[]=sections&with_enrollments=true&enrollment_term_id=%s&per_page=100' % (domain, account_id,termID)
  #print('course:', url)
  while not all_done:
    callCount += 1
    print(callCount, " url: ", url)
    response = requests.get(url,headers=get_headers())
    if not response.json():
      url = ''
      all_done = True
    else:
      for s in response.json():
        course = flattenjson(s, "__")
        if not 'course_format' in s:
          course.update({'course_format': ""})
        #print('id:', s['id'])
        course_count += 1
        courseList.append(course)
        
      if 'next' in response.links:
        url = response.links['next']['url']
        paginated_account_courses(url, account_id, termID, courseList, True)
      else:
        url = ''
        all_done = True
  return courseList 
###########################################################################
def get_course_data(url, courseID, courseList, all_done):
  global callCount
  course_count=0

  if not url:
    url = 'https://%s/api/v1/courses/%s?include[]=storage_quota_used_mb&include[]=term&include[]=total_students&include[]=sections&with_enrollments=true&per_page=100' % (domain, courseID)
  #print('course:', url)
  while not all_done:
    callCount += 1
    print(callCount, " url: ", url)
    response = requests.get(url,headers=get_headers())
    if not response.json():
      url = ''
      all_done = True
    else:
      s = response.json()
      #for s in response.json():
      #print(s)
      course = flattenjson(s, "__")
      if not 'course_format' in s:
        course.update({'course_format': ""})
      #print('id:', s['id'])
      course_count += 1
      courseList.append(course)
        
      if 'next' in response.links:
        url = response.links['next']['url']
        get_course_data(url, courseID, courseList, True )
      else:
        url = ''
        all_done = True
  return courseList 
###########################################################################
def get_enrollments(courseList, courseID, roleType):
  global callCount
  enrollmentsList = []
  all_done = False
  if courseID:
      url = "https://%s/api/v1/courses/%s/enrollments?per_page=100&type[]=%s" % (domain, courseID, roleType)
      while not all_done:
        callCount += 1
        print(callCount, " url: ", url)
        response = requests.get(url,headers=get_headers())
        if not response.json():
          all_done = True
        else:
          for s in response.json():
            enrollments = flattenjson(s, "__")
            enrollmentsList.append(enrollments)
            #print(s)
            #enrollmentsList.append(s)
        if 'next' in response.links:
            url = response.links['next']['url']
        else:
            all_done = True
  else:
    for i in courseList:
      courseID=i['id']
      url = "https://%s/api/v1/courses/%s/enrollments?per_page=100&type[]=%s" % (domain, courseID, roleType)
      while not all_done:
        callCount += 1
        print(callCount, " url: ", url)
        response = requests.get(url,headers=get_headers())
        if not response.json():
          all_done = True
        else:
          for s in response.json():
            enrollments = flattenjson(s, "__")
            enrollmentsList.append(enrollments)
            #print(s)
            #enrollmentsList.append(s)
        if 'next' in response.links:
            url = response.links['next']['url']
        else:
            all_done = True
      
  return enrollmentsList 
###########################################################################
def get_assignments(courseList):
  global callCount
  global start
  assignmentList=[]
  for i in courseList:
    all_done = False
    courseID=i['id']
    teacherList=[]
    sectionList=[]
    teacherNetIDList=[]
    #print(courseID)
    #roleType = "TeacherEnrollment"
    #url = "https://%s/api/v1/courses/%s/enrollments?per_page=100&type[]=%s" % (domain, courseID, roleType)
    #while not all_done:
    #  response = requests.get(url,headers=get_headers())
    #  if not response.json():
    #    all_done = True
    #  else:
    #    for t in response.json():
    #      teacherList.append(t['user']['name'])
    #      #if not t['user']['sis_login_id']:
    #      #  teacherNetIDList.append("n/a")
    #      #else:
    #      #  print (len(t['user']['sis_login_id']))
    #      teacherNetIDList.append(t['user']['login_id'])
    #      sectionList.append(t['sis_section_id'])
    #  if 'next' in response.links:
    #      url = response.links['next']['url']
    #  else:
    #      all_done = True
    url = 'https://%s/api/v1/courses/%s/assignments?per_page=100' % (domain,i['id'])
    print(url)
    
    all_done = False
    while not all_done:
      end = timer()
      seconds = end - start
      m, s = divmod(seconds, 60)
      h, m = divmod(m, 60)
      runtime = 'runtime: %d h :%d m :%d s' % (h, m, s)
      callCount += 1
      print(callCount, " Runtime: ", runtime, " url: ", url)
      response = requests.get(url,headers=get_headers())
      #print(response)
      if not response.json():
        all_done = True
      else:
        for s in response.json():
          t = flattenjson(s, "__")
          #print('enabled:', s['vericite_enabled'])
          if t['vericite_enabled']:
            #print('enabled')
            #if s['published']:
              #if s['has_submitted_submissions']:
                assignment={}
                assignment.update({'account_id' : i['account_id'], 'term__sis_term_id' : i['term__sis_term_id'], 'course_id': t['course_id'], 'sis_course_id' : i['sis_course_id'], 'assignment_id' : t['id']})
                if not 'discussion_id' in t:
                  assignment.update({'discussion_id' : "" })
                else:
                  assignment.update({'discussion_id' : t['quiz_id'] })
                if not 'quiz_id' in t:
                  assignment.update({'quiz_id' : "" })
                else:
                  assignment.update({'quiz_id' : t['quiz_id'] })
                assignment.update({'course_code' : i['course_code'], 'total_students' : i['total_students']})
                #assignment.update({'teachers': teacherList, 'login': teacherNetIDList, 'sections' : sectionList, })
                assignment.update({'published' : t['published'], 'workflow_state' : i['workflow_state']})
                assignment.update({'has_submitted_submittions' : t['has_submitted_submissions'], 'submission_types' : t['submission_types'], 'submissions_download_url' : t['submissions_download_url']})
                assignment.update({'peer_reviews' : t['peer_reviews'], 'points_possible' : t['points_possible']})
                assignment.update({'vericite_enabled' : t['vericite_enabled']})
      
                assignmentList.append(assignment)
                if t['has_submitted_submissions']:
                  #if t['turnitin_settings__submit_papers_to']:
                  folderPath2 = folderPath1 +  str(i['term__sis_term_id']) + str(i['account_id']) + str(t['course_id'])
                    #if not os.path.isdir(folderPath):
                    #   os.makedirs(folderPath)
   
                  #download_submissions(s['course_id'],s['id'], folderPath2)
                  download_submissions(s['course_id'],s['id'], "")

                
      if 'next' in response.links:
          url = response.links['next']['url']
      else:
          all_done = True
      
  return assignmentList 

###########################################################################
###########################################################################
def download_submissions(courseID,assignmentID, folderPath):
  global callCount
  global fileCount
  global fileCountAll
  global submissionsFolder
  fileCountCourse=0
  assessmentList=[]
  all_done = False
  if not os.path.exists(submissionsFolder):
    os.makedirs(submissionsFolder)
  url = 'https://%s/api/v1/courses/%s/assignments/%s/submissions?per_page=100' % (domain,courseID,assignmentID)
  print(url)
  while not all_done:
    callCount += 1
    print(callCount, " url: ", url)
    response = requests.get(url,headers=get_headers())
    #print(response)
    if not response.json():
      all_done = True
    else:
      for a in response.json():
        #print(a)
        if 'attachments' in a:
          for b in a['attachments']:
            attachmentID = b['id']
            fileName = b['filename']
            urlFile = b['url']
            fileSize = b['size']
            contentType = b['content-type']
            #contentPieces = contentType.split("/")
            contentPieces = fileName.split(".")
            fileExtension = contentPieces[len(contentPieces)-1]
            contentName = contentPieces[0]
            #truncate name down to a max of 200 characters
            if len(contentName) > 200:
              contentName = contentName[:200]
            fileName = contentName + "." + fileExtension
            #print(fileExtension)
            #filePath = folderPath + "/" + fileName
            fileNameAttachment = str(attachmentID) + "_" + fileName
            filePath = 'submissions/%s/%s' % (submissionsFolder, fileNameAttachment)
            extAvailable = ["doc", "docx", "pdf", "rtf", "txt", "ps", "wp", "odt", "ods", "odp"]
            #print(filePath)
            
            fileCountAll +=1
            if os.path.isfile(filePath):
              print('File already exists: ', fileName)
            else:  
              if fileExtension in extAvailable:
                fileCountCourse +=1
                fileCount +=1
                r = requests.get(urlFile)
                with open(filePath, "wb") as code:
                  code.write(r.content)
                    

    if 'next' in response.links:
      url = response.links['next']['url']
    else:
      print("Course downloadCount:", fileCountCourse)
      print("Running downloadCount:", fileCount)
      print("All Files:", fileCountAll)
      all_done = True

###########################################################################
###########################################################################
###########################################################################
###########################################################################
###########################################################################
###########################################################################

token = getpass.getpass('Canvas Token:')

if not token:
  token = input('Canvas Token is a required field:')
if not token:
    print('#########################################################################')
    print('The Canvas Token is a required field.')
    print('Exiting script.')
    print('#########################################################################')
    exit()

domain = input('Domain Name (i.e.: ewu.test.instructure.com):')
if not domain:
    print('#########################################################################')
    print('The Canvas Domain name is a required field.')
    print('Exiting script.')
    print('#########################################################################')
    exit()
    
root_account_id = getRootID()
if root_account_id == "No Root":
  print('#########################################################################')
  print('ERROR: Could not find the Root ID. Please enter an account id.')
  print('#########################################################################')
  exit()





courseFilter = input('Do you want to filter data to selected courses, If yes, enter the Course ID(s) [if multiple courses, seperate with a comma: 1234, 5678, 9012], otherwise leave blank:')
if courseFilter:
#  courseInput = input('Enter the Course ID(s) [if multiple courses, seperate with a comma: 1234, 5678, 9012]:')
  #if not courseInput:
  #    print('#########################################################################')
  #    print('The Course ID is a required field.')
  #    print('Exiting script.')
  #    print('#########################################################################')
  #    exit()
      
  print('#########################################################################')
  print(courseFilter)
  #courseList = [int(courseInput) for courseInput in input().split(",")]
  if ',' in courseFilter:
    courseNumbers = [int(courseFilter) for courseFilter in input().split(",")]
  else:
    #courseNumbers = [{'id' : int(courseFilter)} ]
    courseNumbers = [int(courseFilter) ]
  print(courseNumbers)
else:
  courseNumbers = False
  displayTerm = input('Do you want to display term ids? (Y=yes, else enter the termid, or enter All to use all terms):')
  if displayTerm.upper() == 'Y':
    termData = get_terms(root_account_id)
    print('Term ID     NAME')
    termList=[]
    for t in termData:
      termList.append(t['term_id'])
      print(t['term_id'], ' - ', t['term_name'])
      
    termID = input('Enter the Term ID:')
  #elif not isinstance(int(displayTerm), int):
  #  if not displayTerm.upper() == 'ALL':
  #    termID = ''
  else:
    termID = displayTerm
    termList = [displayTerm]
    
  #if isinstance(termID, int) == False:
  #    termID = ''
      
  if not termID:
      print('#########################################################################')
      print('The Term is a required field.')
      print('Exiting script.')
      print('#########################################################################')
      exit()
  accountFilter = input('Do you want to filter data to selected sub-account (Y=yes, N=no):')
  if accountFilter.upper() == 'Y':
    account_id = input('Enter the account id:')
    if not account_id:
      account_id = root_account_id
    collegeSubAccounts = [account_id]
  else:
    account_id = root_account_id
    #
    collegeSubAccounts=[102894, 102895, 102896, 102897, 102898, 103422]
      
  #print('#########################################################################')
  #courseList = get_courses(account_id, termID)
  #print('Count of rows in courseList:',len(courseList))
  #enrollmentList = get_enrollments(courseList, "", "TeacherEnrollment")
  #print('Count of rows in enrollmentList:',len(enrollmentList))
  

if courseNumbers:
  courseList=[]
  for i in courseNumbers:
    #submissionsFolder = 'submissions_course'+ str(i)
    submissionsFolder = folderPath1 +'submissions_course'+ str(i)
    courseList = get_course_data(False,i, courseList, False)
  csvFileName = "Canvas-turnitin_submissions" + '_course'
  print('Count of rows in courseList:',len(courseList))
  print('#########################################################################')
  #keys = courseList[0].keys()
  #with open('courseList.csv', 'w', newline='') as fp:
  #    a = csv.DictWriter(fp, keys)
  #    a.writeheader()
  #    a.writerows(courseList)
  #print('courseList.csv file complete')
  end = timer()
  seconds = end - start
  m, s = divmod(seconds, 60)
  h, m = divmod(m, 60)
  runtime = 'runtime: %d h :%d m :%d s' % (h, m, s)
  print (runtime)
  print('#########################################################################')
  if len(courseList) > 0:
    assignmentList = get_assignments(courseList)
    print('#########################################################################')
    #print(courseList)
    print('Count of rows in assignmentList:',len(assignmentList))
    end = timer()
    print('runtime:',end - start)  
    print('#########################################################################')
    print('#########################################################################')
    if len(assignmentList) > 0:
      hasData = True
      turnitinList = assignmentList
else:
  for t in termList:
    termID = t
    #submissionsFolder = 'submissions_term'+ str(termID)
    submissionsFolder = folderPath1+'submissions_term'+ str(termID)
    csvFileName = "Canvas-turnitin_submissions" + '_' + str(termID)
    for subaccount in collegeSubAccounts:
      account_id = subaccount
      csvFileName = csvFileName + '_' + str(account_id)
      print('#########################################################################')
      print('#########################################################################')
      print('#########################################################################')
      print('sub-account: ', account_id)
      print('#########################################################################')
      courseList = get_courses(account_id, termID)
      print('Count of rows in courseList:',len(courseList))
      print('#########################################################################')
      #keys = courseList[0].keys()
      #with open('courseList.csv', 'w', newline='') as fp:
      #    a = csv.DictWriter(fp, keys)
      #    a.writeheader()
      #    a.writerows(courseList)
      #print('courseList.csv file complete')
      end = timer()
      seconds = end - start
      m, s = divmod(seconds, 60)
      h, m = divmod(m, 60)
      runtime = 'runtime: %d h :%d m :%d s' % (h, m, s)
      print (runtime)
      print('#########################################################################')
      if len(courseList) > 0:
        assignmentList = get_assignments(courseList)
        print('#########################################################################')
        #print(courseList)
        print('Count of rows in assignmentList:',len(assignmentList))
        end = timer()
        seconds = end - start
        m, s = divmod(seconds, 60)
        h, m = divmod(m, 60)
        runtime = 'runtime: %d h :%d m :%d s' % (h, m, s)
        print (runtime)
        print('Total Files Downloaded: ', fileCount)
        print('#########################################################################')
        print('#########################################################################')
        if len(assignmentList) > 0:
          hasData = True
          turnitinList = assignmentList
          
if hasData:
  #create the csv file
  keys = turnitinList[0].keys()
  #print('keys:', keys)
  
  csvFileName = csvFileName + '_' + str(start) + '.csv'
  #csvFileName = csvFileName + '_quiz_data.csv'
  print(csvFileName,'.csv file save started')
  
  with open(csvFileName, 'w', newline='') as fp:
      a = csv.DictWriter(fp, keys)
      a.writeheader()
      a.writerows(turnitinList)
  print(csvFileName,'.csv file complete')
  print('#########################################################################')
else:
  hasData = False
  
end = timer()

seconds = end - start
m, s = divmod(seconds, 60)
h, m = divmod(m, 60)
runtime = 'runtime: %d h :%d m :%d s' % (h, m, s)
print (runtime)