import requests
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import pickle
import os
from google.cloud import storage
import base64

#get data from Google Sheets API
def get_data(sheet):
  from main import init_gapi
  spreadsheet_id, api_key, sheetdb_url, DISCOVERY_SERVICE_URL, service, max_column = init_gapi()
  ranges = [f'{sheet}!A:{max_column}']
  request = service.spreadsheets().values().batchGet(
    spreadsheetId=spreadsheet_id, ranges=ranges, majorDimension='ROWS')

  response = request.execute()
  response = response['valueRanges'][0]['values']

  data = []

  headers = response[0]  # Assumes the first row contains headers
  for row in response[1:]:
    row_data = {}
    for index, value in enumerate(row):
      header = headers[index]
      row_data[header] = value
    data.append(row_data)
  # print("data from get_data:", data)
  return data

def get_gclassroom_api_data():
  SCOPES = ['https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.coursework.me.readonly']
  creds = None
  # The file token.pickle stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first time.
  if os.path.exists('token.pickle'):
      with open('token.pickle', 'rb') as token:
          creds = pickle.load(token)
  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
      print("checkpoint 0")
      flow = InstalledAppFlow.from_client_secrets_file(
          'static/SciWeb_API_secret.json', SCOPES)
      creds = flow.run_local_server(port=8090)
      # Save the credentials for the next run
      with open('token.pickle', 'wb') as token:
          pickle.dump(creds, token)

  try:
      print("checkpoint 1")
      service = build('classroom', 'v1', credentials=creds)

      # Call the Classroom API to fetch the list of courses
      courses = service.courses().list().execute().get('courses', [])
      if not courses:
          print('No courses found.')
          return

      for course in courses:
          print("checkpoint 2")
          print(f"Course: {course['name']} (ID: {course['id']})")

          # Fetch course work for this course
          course_works = service.courses().courseWork().list(courseId=course['id']).execute().get('courseWork', [])
          for work in course_works:
              print(f"\tAssignment: {work['title']} Due: {work.get('dueDate', 'No due date')}")
                
  except Exception as error:
      print(f"An error occurred: {error}")


# Function to post data to sheetdb
def post_data(sheet, data, x, allow_demo_change=True):
  # print(data)
  from main import get_name, init_gapi
  a,b, sheetdb_url, c,d,e = init_gapi()
  user_data = get_name()
  if not isinstance(user_data, tuple) and sheet !="Users" and user_data['osis'] == '3428756' and not allow_demo_change:
    message = "rejected: can't change demo account data"
    print(message)
    return message
  
  url = sheetdb_url + "?sheet=" + sheet
  print(data)
  response = requests.post(url, json=data)
  print("POST error", response.text)
  print(response, url)
  return response


#delete data from sheetdb
def delete_data(sheet, row_value, row_name, session, sheetdb_url, allow_demo_change=False):
  if 'user_data' in session and not isinstance(session['user_data'], tuple) and sheet !="Users" and session['user_data']['osis'] == '3428756' and not allow_demo_change:
    message = "rejected: can't delete demo account data"
    print(message)
    return message
  print("deleting data", sheetdb_url)
  url = sheetdb_url + "/" + str(row_name) + "/" + str(row_value) + "?sheet=" + sheet
  response = requests.delete(url)
  print(response.text)
  print(response, url)
  return response

def update_data(row_val, row_name, new_row, sheet, session, sheetdb_url, allow_demo_change=False):
  print("in update_data")
  # delete_data(sheet, row_val, row_name, session, sheetdb_url, allow_demo_change)
  # post_data(sheet, new_row, sheetdb_url, allow_demo_change)
  url = sheetdb_url + "/" + str(row_name) + "/" + str(row_val) + "?sheet=" + sheet
  response = requests.patch(url, json=new_row)
  print(response.text)
  print(response, url)
  return response


def upload_file(bucket_name, base64_string, destination_blob_name):
    """Uploads a file to the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(str(destination_blob_name))

    content = base64.urlsafe_b64decode(base64_string + '==')  # Adding a fixed padding. This will be ignored if not needed.
    
    # Use the blob.upload_from_string method to upload the binary content
    blob.upload_from_string(content)

    print(f"Content uploaded to {destination_blob_name}.")

def download_file(bucket_name, source_blob_name):
    """Downloads a blob from the bucket and returns it as a base64 string."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    # Download the blob's content as a bytes object.
    content = blob.download_as_bytes()

    # Convert the bytes object to a base64 encoded string.
    base64_encoded_content = base64.b64encode(content).decode()

    print(f"Blob {source_blob_name} downloaded and converted to base64.")
    return base64_encoded_content