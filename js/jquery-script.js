(document).ready(function() {
  $('header p.handwritten').css('font-size', '3.5rem');

  $('.gallery img').hover(
    function() {
      $(this).animate({opacity: 0.8}, 200);
    },
    function() {
      $(this).animate({opacity: 1}, 200);
    }
  );

  $('nav a').click(function(e) {
    e.preventDefault();
    $(this).animate({fontSize: '1.2em'}, 100)
      .animate({fontSize: '1em'}, 100);
  });

  $('#hours-toggle').click(function() {
    $('#hours-list').slideToggle();
  });

  $('section').hide().each(function(index) {
    $(this).delay(200 * index).fadeIn(500);
  });

  $('nav').append('<div id="reservation-counter">Tables Available: ' + tablesAvailable + '</div>');

  $('#reserveForm').submit(function(e) {
    e.preventDefault();
    updateTables(true);
    $('#reservation-counter').text('Tables Available: ' + tablesAvailable);
    alert('Reservation submitted!');
    closeModal('reserveModal');
  });

  $('#our-story').append('<button id="recommend-btn">Recommend a Dish</button>');

  $('#recommend-btn').click(function() {
    const dish = prompt("What dish would you recommend we add to our menu?");
    if (dish) {
      addFeaturedDish(dish);
      $('.featured-dishes').fadeOut(300).fadeIn(300);
    }
  });
});

