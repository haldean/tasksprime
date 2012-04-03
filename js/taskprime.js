;(function() {
  var loading = true
  var task_field_init = false
  var date_field_init = false

  var startLoad = function() {
    loading = true
    loadTick()
  }

  var loadTick = function() {
    var loader = $('#loader')
    if (!loading) {
      loader.css('display', 'none')
      return
    }

    if (loader.css('display') == 'none') {
      loader.css('display', 'block')
    } else {
      loader.css('display', 'none')
    }

    setTimeout(loadTick, 500)
  }

  var endLoad = function() {
    loading = false
  }

  var makeTaskLi = function(task) {
    var taskli = '<li id="' + task.id + '" class="'
    if (task.complete) {
      taskli += 'complete'
    } else {
      taskli += 'incomplete'
    }
    taskli += ' task"><span class="check">&#x2713;</span>'
    taskli += task.title + '</a></li>'
    return taskli
  }

  var getTasks = function(callback) {
    $.ajax({
      url: '/tasks/json',
      type: 'json',
      method: 'get',
      success: function(resp) {
        $('#tasklist .task').remove()

        var task_count = resp.length
        var incomplete_count = 0
        for (var i = 0; i < task_count; i++) {
          if (!resp[i].complete) {
            incomplete_count++
          }
          $('#tasklist').append(makeTaskLi(resp[i]))
        }
        $('#tasks-todo').html(incomplete_count + ' things to do, ' +
          task_count + ' things done.')
        bindEvents()

        if (callback) callback()
      }
    })
  }

  var bindEvents = function() {
    $('.incomplete').click(function(ev) {
      var id = ev.currentTarget.id

      $('#' + id + ' .check').css('color', '#000')
      var hide = function() {
        $('#' + id).removeClass('incomplete').addClass('complete')
      }
      setTimeout(hide, 800)

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
    startLoad()
    getTasks(endLoad)

    $('#complete').click(function(e) {
      if ($('#complete').attr('checked')) {
        $('.complete').css('display', 'list-item')
      } else {
        $('.complete').css('display', 'none')
      }
    })

    $('#incomplete').click(function(e) {
      if ($('#incomplete').attr('checked')) {
        $('.incomplete').css('display', 'list-item')
      } else {
        $('.incomplete').css('display', 'none')
      }
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

      startLoad()
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
})();
