from apiclient.discovery import build
from datetime import datetime
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from oauth2decorator import OAuth2Decorator
import httplib2
import settings

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
        'id': task['id'],
        'title': task['title'],
        'due': datetime.strptime(task['due'], '%Y-%m-%dT%H:%M:%S.000Z'),
        'complete': task['status'] == 'completed'})
  return tasks

class SplashHandler(webapp.RequestHandler):
  @decorator.oauth_check
  def get(self):
    if decorator.has_credentials():
      self.redirect('/tasks/')
    else:
      self.response.out.write(template.render('templates/convert.html',
        {'authorize_url': '/tasks/'}))

class CompletedHandler(webapp.RequestHandler):
  @decorator.oauth_required
  def get(self):
    service = build('tasks', 'v1', http=decorator.http())

    task = service.tasks().get(tasklist='@default',
        task=self.request.get('task')).execute()
    task['status'] = 'completed'

    result = service.tasks().update(tasklist='@default', task=task['id'], body=task).execute()
    self.response.out.write('success')

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
    [('/', SplashHandler),
      ('/tasks/', TasksHandler),
      ('/complete/', CompletedHandler)],
    debug=True)

def main():
  run_wsgi_app(application)
