;

$.domReady(function () {
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
    console.log(title)
    if (!title) {
      $('#addtask').focus()
      return
    }

    if (! $('#adddate').val()) {
      $('#adddate').focus()
      return
    }

    $('#loading').css('display', 'block')

    var check_span = '<span class="check">&nbsp;</span>'
    var item = '<a class="title">' + title + '</a>'
    $.ajax({
      url: '/',
      type: 'html',
      method: 'get',
      data: { 'title': title, 'date': $('#adddate').val() },
      success: function(resp) {
        $('#loading').css('display', 'none')
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
