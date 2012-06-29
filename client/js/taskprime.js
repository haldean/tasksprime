var loading = false;
var task_field_init = false;
var date_field_init = false;
var blink_high = false;
var last_checked = undefined;
var task_list = '@default';

var startLoad = function() {
  if (!loading) {
    loading = true
    loadTick()
  }
}

var loadTick = function() {
  var loader = $('.tasks-title')

  var blink_on = function() {
    loader.css('color', '#FFF')
  }

  var blink_off = function() {
    loader.css('color', '#666')
  }

  if (!loading) {
    blink_on()
    return
  } else if (blink_high) {
    blink_off()
  } else {
    blink_on()
  }

  blink_high = !blink_high
  setTimeout(loadTick, 300)
}

var endLoad = function() {
  loading = false
}

var authorize = function(immediate, reload) {
  var config = {
    'client_id': '683217246670-u3e76r7hq0ek5vus9kr7cj4tassh5l7u.apps.googleusercontent.com',
    'scope': 'https://www.googleapis.com/auth/tasks',
    'immediate': immediate,
  };

  gapi.auth.authorize(config, function(result) {
    if (reload) window.location.reload();

    if (!result && immediate) {
      window.setTimeout(function() { authorize(false, true); }, 5);
    } else if (!result) {
      alert('Unable to authorize with the Google Tasks API. Did you grant the correct permissions?');
    } else {
      gapi.client.load('tasks', 'v1', function() { getLists(); getTasks(endLoad); });
    }
  });
}

var apiLoad = function() {
  startLoad();
  gapi.client.setApiKey('AIzaSyAhnwP7S4TIZ8JSNSzq3It78SMqq9FJqCM');

  window.setTimeout(function() {
    authorize(true, false);
  }, 1);
}

var getLists = function() {
  gapi.client.tasks.tasklists.list().execute(function(resp) {
    $('#tasks-lists option').remove();

    var lists = resp.result.items;
    gapi.client.tasks.tasklists.get({'tasklist': '@default'}).execute(function(inner_resp) {
      var default_id = inner_resp.result.id;
      var dropdown = $('#tasks-lists')
      for (var i = 0; i < lists.length; i++) {
        var list = lists[i];
        dropdown.append(
          '<option value="' + list.id + '">' + list.title + '</option>');
      }
      dropdown.val(default_id);
      dropdown.css('display', 'inline');
    });
  });
}

var makeTaskLi = function(task) {
  var taskli = '<li id="' + task.id + '" class="'
  if (task.complete) {
    taskli += 'complete'
  } else {
    taskli += 'incomplete'
  }
  taskli += ' task"><span class="check">&#x2713;</span>' + task.title
  if (task.due) {
    var dp = task.due.split('/')
    var ms_from_now = (new Date(+dp[0], +dp[1] - 1, +dp[2])).getTime() - Date.now()
    var days_from_now = ms_from_now / (1000 * 60 * 60 * 24)

    taskli += '<span class="due">' + task.due + ' ('
    taskli += Math.ceil(days_from_now) + ' days)</span>'
  }
  taskli += '</li>'
  return taskli
}

var getTasks = function(callback) {
  var request = gapi.client.tasks.tasks.list({
    'tasklist': task_list,
    'showCompleted': false,
  });
  request.execute(function(resp) {
    tasks = resp.items;

    $('#tasklist .task').remove();
    $('#tutorial').css('display', 'none');

    var task_count = tasks.length;
    var incomplete_count = 0;
    for (var i = 0; i < task_count; i++) {
      if (!tasks[i].complete) {
        incomplete_count++;
      }
      $('#tasklist').append(makeTaskLi(tasks[i]));
    }

    if (task_count > 0) {
      $('#tasks-todo').html(incomplete_count + ' things to do');
        // + ', ' + (task_count - incomplete_count) + ' things done.');
      bindEvents();
    } else {
      $('#tasks-todo').html('no tasks yet. add one above to get started!');
      $('#tutorial').css('display', 'block');
    }

    if (callback) callback();
  });
}

var setLastChecked = function(id) {
  last_checked = id
  $('#undo').show()
}

var bindEvents = function() {
  $('.incomplete').click(function(ev) {
    var id = ev.currentTarget.id
    setLastChecked(id)

    $('#' + id + ' .check').css('color', '#000')
    var hide = function() {
      $('#' + id).removeClass('incomplete').addClass('complete')
    }
    setTimeout(hide, 800)

    gapi.client.tasks.tasks.get({
      'tasklist': task_list,
      'task': id,
    }).execute(function(resp) {
      task = resp.result;
      task.status = 'completed';

      gapi.client.tasks.tasks.update({
        'tasklist': task_list,
        'task': id,
        'resource': task,
      }).execute(function(inner_resp) {

      });
    });
  })
}

$.domReady(function () {
  $('#undo').hide()
  $('#adddate').calender()

  $('#complete').click(function(e) {
    if ($('#complete').attr('checked')) {
      $('.complete').css('display', 'list-item')
    } else {
      $('.complete').css('display', 'none')
    }
  });

  $('#incomplete').click(function(e) {
    if ($('#incomplete').attr('checked')) {
      $('.incomplete').css('display', 'list-item')
    } else {
      $('.incomplete').css('display', 'none')
    }
  });

  $('#undo').click(function(e) {
    if (last_checked) {
      startLoad();
      last_checked_id = last_checked;

      gapi.client.tasks.tasks.get({
        'tasklist': task_list,
        'task': last_checked_id,
      }).execute(function(resp) {
        undo_task = resp.result;
        delete undo_task.completed;
        undo_task.status = 'needsAction';

        gapi.client.tasks.tasks.update({
          'tasklist': task_list,
          'task': last_checked_id,
          'resource': undo_task,
        }).execute(function(inner_resp) {
          getTasks(endLoad);
        });
      });
    }

    last_checked = undefined
    $('#undo').hide()
  })

  $('#addtask').focus(function(e) {
    if (!task_field_init) {
      $('#addtask').val('').css('color', '#000')
    task_field_init = true
    }
  })

  $('#adddate').focus(function(e) {
    if (!date_field_init) {
      $('#adddate').val('').css('color', '#000')
    date_field_init = true
    }
  })

  $('#addform').submit(function(e) {
    e.preventDefault();
    e.stopPropagation();

    var title = $('#addtask').val();
    if (!title) {
      $('#addtask').focus();
      return;
    }

    startLoad();
    var check_span = '<span class="check">&nbsp;</span>';
    var item = '<a class="title">' + title + '</a>';

    gapi.client.tasks.tasks.insert({
      'tasklist': task_list,
      'resource': {
        'title': title,
      },
    }).execute(function(result) {
      getTasks(function() {
        $('#addtask').val('');
        $('#adddate').val('');
        endLoad();
      });
    });
  });

  $('#tasks-lists').change(function(e) {
    task_list = $('#tasks-lists').val();
    getTasks();
  });
})
