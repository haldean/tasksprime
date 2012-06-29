var loading = false
var task_field_init = false
var date_field_init = false
var blink_high = false
var last_checked = undefined

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

var apiLoad = function() {
  startLoad();
  gapi.client.setApiKey('AIzaSyAhnwP7S4TIZ8JSNSzq3It78SMqq9FJqCM');

  window.setTimeout(function() {
    var config = {
      'client_id': '683217246670',
      'scope': 'https://www.googleapis.com/auth/tasks',
    };

    gapi.auth.authorize(config, function(result) {
      console.log(result);
      console.log('authorized');
      console.log(gapi.auth.getToken());

      gapi.client.load('tasks', 'v1', afterLoaded);
    });
  }, 1);
}

var afterLoaded = function() {
  getTasks(endLoad);
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
    'tasklist': '@default',
    'showCompleted': false,
  });
  request.execute(function(resp) {
    $('#tasklist .task').remove();
    $('#tutorial').css('display', 'none');

    var task_count = resp.length;
    var incomplete_count = 0;
    for (var i = 0; i < task_count; i++) {
      if (!resp[i].complete) {
        incomplete_count++;
      }
      $('#tasklist').append(makeTaskLi(resp[i]));
    }

    if (task_count > 0) {
      $('#tasks-todo').html(incomplete_count + ' things to do, ' +
        (task_count - incomplete_count) + ' things done.');
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

    /* TO DO */
    $.ajax({
      url: '/complete/',
      type: 'html',
      method: 'get',
      data: { 'task': id },
      success: function(resp) {
        if (resp != 'success') {
          alert('Could not mark as done.')
          console.log(resp)
        }
      }
    })
    getTasks()
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
      startLoad()
      $.ajax({
        url: '/undo/',
        type: 'html',
        method: 'get',
        data: { 'task': last_checked },
        success: function(e) { getTasks(function() { endLoad() } ) }
      })
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
    e.preventDefault()
    e.stopPropagation()

    var title = $('#addtask').val()
    if (!title) {
      $('#addtask').focus()
    return
    }

    startLoad();
    var check_span = '<span class="check">&nbsp;</span>'
    var item = '<a class="title">' + title + '</a>'
    $.ajax({
      url: '/tasks/',
      type: 'html',
      method: 'get',
      data: { 'title': title, 'date': $('#adddate').val() },
      success: function(resp) {
        if (resp == 'success') {
          getTasks(function() {
            $('#addtask').val('')
            $('#adddate').val('')
            endLoad()
          })
        } else {
          endLoad()
      alert('Failed to save task.')
      console.log(resp)
        }
      }
    })
  })
})
