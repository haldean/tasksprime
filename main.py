from apiclient.discovery import build
from datetime import datetime
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api.users import get_current_user
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

  if 'items' not in task_service:
    return []

  for task in task_service['items']:
    if task['title']:
      if 'due' in task:
        due = datetime.strptime(task['due'], '%Y-%m-%dT%H:%M:%S.000Z')
      else:
        due = None

      tasks.append({
        'id': task['id'],
        'title': task['title'],
        'due': due,
        'complete': task['status'] == 'completed'})

  def compare_dates(d1, d2):
    try:
      return cmp(d1, d2)
    except:
      if not d1 and d2: return -1
      if d1 and not d2: return 1
      return 0
  tasks.sort(cmp=compare_dates, key=lambda x: x['due'])
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

class ApiHandler(webapp.RequestHandler):
  @decorator.oauth_check
  def get(self):
    if not decorator.has_credentials():
      return

    self.response.headers['Content-Type'] = 'application/json'

    import json
    def strip_dates(d):
      del d['due']
      return d
    tasks = map(strip_dates, get_tasks())
    self.response.out.write(json.dumps(tasks))

class TasksHandler(webapp.RequestHandler):
  @decorator.oauth_required
  def get(self):
    if self.request.get('title'):
      if self.request.get('date') and self.request.get('date') != 'date':
        date = datetime.strptime(self.request.get('date'), '%m-%d-%Y')
        task = {
            'title': self.request.get('title'),
            'notes': '',
            'due': date.strftime('%Y-%m-%dT%H:%M:%S.000Z')
            }
      else:
        task = { 'title': self.request.get('title') }

      service = build('tasks', 'v1', http=decorator.http())
      result = service.tasks().insert(tasklist='@default', body=task).execute()
      self.response.out.write('success')
    else:
      self.response.out.write(template.render('templates/index.html', {
        'user': get_current_user().nickname() }))

application = webapp.WSGIApplication(
    [('/', SplashHandler),
      ('/tasks/json', ApiHandler),
      ('/tasks/', TasksHandler),
      ('/complete/', CompletedHandler)],
    debug=True)

def main():
  run_wsgi_app(application)

if __name__ == '__main__':
  main()
