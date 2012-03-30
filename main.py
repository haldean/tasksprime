from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from apiclient.discovery import build
import httplib2
from oauth2client.appengine import OAuth2Decorator
import settings
from datetime import datetime
from google.appengine.ext.webapp import template

decorator = OAuth2Decorator(
    client_id=settings.CLIENT_ID,
    client_secret=settings.CLIENT_SECRET,
    scope=settings.SCOPE,
    user_agent='mytasks')

def get_tasks():
  tasks = []
  service = build('tasks', 'v1', http=decorator.http())
  task_service = service.tasks().list(tasklist='@default').execute()
  for task in task_service['items']:
    if task['title']:
      tasks.append({
        'title': task['title'],
        'due': datetime.strptime(task['due'], '%Y-%m-%dT%H:%M:%S.000Z'),
        'complete': task['status'] == 'completed'})
  return tasks

class SplashHandler(webapp.RequestHandler):
  @decorator.oauth_aware
  def get(self):
    if not decorator.has_credentials():
      self.response.out.write(template.render('templates/convert.html',
        {'authorize_url': decorator.authorize_url()}))
    else:
      self.redirect('/tasks/')

class TasksHandler(webapp.RequestHandler):
  @decorator.oauth_required
  def get(self):
    if self.request.get('title'):
      date = datetime.strptime(self.request.get('date'), '%m/%d/%Y')
      task = {
          'title': self.request.get("title"),
          'notes': '',
          'due': date.strftime('%Y-%m-%dT%H:%M:%S.000Z')
          }

      service = build('tasks', 'v1', http=decorator.http())
      result = service.tasks().insert(tasklist='@default', body=task).execute()
      self.response.out.write('success')
    else:
      tasks = get_tasks()
      #tasks = sample_tasks()
      tasks.sort(key=lambda x: x['due'])
      self.response.out.write(template.render('templates/index.html',
                                              {'tasks': tasks}))

application = webapp.WSGIApplication(
    [('/', SplashHandler), ('/tasks/', TasksHandler)], debug=True)

def main():
  run_wsgi_app(application)
