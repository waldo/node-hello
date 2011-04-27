$(document).ready(function(){
  $(".new-posts").toggle()
    .after("<a class='new-post'>Add a new post</a>")
    .before("<div id='result'></div>").hide();

  $("a.new-post").click(function(event){
    $(".new-posts").show();
    $("a.new-post").hide();
  });
  
  $('form#post').submit(function() {
    event.preventDefault(); 

    var $form = $(this);
    var term = $form.find(':input').serializeArray();
    var url = $form.attr('action');

    $.post(url, term, function(data) {
      $("#result").html(data).show();
    });
  });
});