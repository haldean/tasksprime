from oauth2client.appengine import OAuth2Decorator as oa2d
from oauth2client.appengine import StorageByKeyName, CredentialsModel
from google.appengine.api import users

class OAuth2Decorator(oa2d):
  def oauth_check(self, method):
    """Decorator that checks if a user is authenticated and has permissions.

    This decorator will initialize credentials and authorize_url, but will not
    take any action if the user is not logged in.  From within a method
    decorated with @oauth_aware the has_credentials() and authorize_url()
    methods can be called.

    Args:
      method: callable, to be decorated method of a webapp.RequestHandler
        instance.
    """

    def setup_oauth(request_handler, *args, **kwargs):
      if self._in_error:
        self._display_error_message(request_handler)
        return

      user = users.get_current_user()
      # Don't use @login_decorator as this could be used in a POST request.
      if not user:
        self.credentials = None
        method(request_handler, *args, **kwargs)
        return


      self.flow.params['state'] = request_handler.request.url
      self._request_handler = request_handler
      self.credentials = StorageByKeyName(
          CredentialsModel, user.user_id(), 'credentials').get()
      method(request_handler, *args, **kwargs)
    return setup_oauth
