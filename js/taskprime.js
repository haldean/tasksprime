var startLoad = function() {
  $('#loading').css('display', 'block')
}

var endLoad = function() {
  $('#loading').css('display', 'none')
}

;$.domReady(function () {
  $('.incomplete .check').click(function(ev) {
    var id = ev.currentTarget.id
    startLoad()

    $.ajax({
      url: '/complete/',
      type: 'html',
      method: 'get',
      data: { 'task': id },
      success: function(resp) {
        endLoad()
        $('#' + id).parents('li').removeClass('incomplete').addClass('complete')
      }
    })
  })

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

  $('#addform').submit(function(e) {
    e.preventDefault()
    e.stopPropagation()

    var title = $('#addtask').val()
    if (!title) {
      $('#addtask').focus()
      return
    }

    if (! $('#adddate').val()) {
      $('#adddate').focus()
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
        endLoad()
        if (resp == 'success') {
          $.create('<li>').addClass('incomplete').append(check_span).append(item).insertAfter('.add')
          $('#addtask').val('')
          $('#adddate').val('')
        } else {
          alert('Failed to save task.')
          console.log(resp)
        }
      }
    })
  })
})
