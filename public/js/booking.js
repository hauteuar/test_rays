$(document).ready(function () {
  let view = 'daily'; // Initialize the view variable
  let filteredSportId = null; // Initialize a variable to store the filtered sport ID

  function fetchUserProfile() {
    const token = localStorage.getItem('token');
    console.log(token);

    $.ajax({
      url: '/api/user/profile', // Corrected URL string
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      success: function(response) {
        console.log(response);
        const data = response; 
        const organizationName = data.organizationName;
        localStorage.setItem('organizationName', organizationName);
      },
      error: function(error) {
        console.error('Error fetching user profile', error);
      }
    });
  }

  fetchUserProfile();

  const organizationName = localStorage.getItem('organizationName');
  console.log(organizationName);

  function toggleVisibility() {
    if ($('#pills-day-tab').hasClass('active')) {
      view = 'daily';
      $('.for-day').show();
      $('.for-weekly').hide();
    } else if ($('#pills-week-tab').hasClass('active')) {
      view = 'weekly';
      $('.for-day').hide();
      $('.for-weekly').show();
    } else {
      $('.for-day').hide();
      $('.for-weekly').hide();
    }
    console.log('View updated to:', view); // For debugging, to check the value of the view variable
  }

  toggleVisibility(); // Initial call to set the visibility based on the active tab

  $('#pills-tab2 a').on('shown.bs.tab', function (event) {
    toggleVisibility();
    loadBookings(); // Re-load bookings to reflect the new view
  });

  console.log(view); // For debugging, to check the value of the view variable

  // Separate script for the second set of tabs
  let view2 = 'daily'; // Initialize the view variable

  function toggleVisibility2() {
    if ($('#pills-day2-tab').hasClass('active')) {
      view2 = 'daily';
      $('.for-day2').show();
      $('.for-weekly2').hide();
    } else if ($('#pills-week2-tab').hasClass('active')) {
      view2 = 'weekly';
      $('.for-day2').hide();
      $('.for-weekly2').show();
    } else {
      $('.for-day2').hide();
      $('.for-weekly2').hide();
    }
    console.log('View2 updated to:', view2); // For debugging, to check the value of the view2 variable
  }

  toggleVisibility2(); // Initial call to set the visibility based on the active tab

  $('#pills-tabContent2 a').on('shown.bs.tab', function (event) {
    toggleVisibility2();
  });

  console.log(view2); // For debugging, to check the value of the view2 variable

  if ($('#pills-week-tab').hasClass('active')) {
    view = 'weekly';
  } else {
    view = 'daily';
  }

  console.log(view);

  // Set current date for date pickers
  const currentDate = new Date().toISOString().split('T')[0];
  $('#startDate, #endDate, #startDateNotActive, #endDateNotActive').val(currentDate);

  // Display current date in a readable format
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $('#current-date-day').text(new Date().toLocaleDateString(undefined, options));
  const weekOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const weekStart = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(weekStart.getDate() + 6);
  $('#current-date-week').text(`${weekStart.toLocaleDateString(undefined, weekOptions)} - ${weekEnd.toLocaleDateString(undefined, weekOptions)}`);

  // Global variables to hold sports and courts data
  let sports = [];
  let courts = [];
  let bookings = [];
  let users = [];

  // Load initial calendar view
  //fetchUserProfile();
  loadBookings();
  loadSports();
  loadAllCourts();
  loadUsers();

  // Fetch and display bookings on the calendar
  function loadBookings() {
    $.ajax({
      url: '/api/bookings',
      method: 'GET',
      headers: { 'organizationName': organizationName },
      success: function (response) {
        bookings = response; // Store bookings globally
        // Clear existing bookings on the calendar
        $('.calendar .booking-block').remove();

        // Initialize calendar with time slots
        initializeCalendar(view);
      },
      error: function (error) {
        console.error('Error fetching bookings:', error);
      }
    });
  }

  // Initialize calendar with time slots
  function initializeCalendar(view) {
    const timeSlots = ['8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm'];
    const calendarBody = $('.calendar tbody');
    const calendarHead = $('.calendar thead tr');
    calendarBody.empty();
    calendarHead.empty();

    if (view === 'daily') {
      $('#current-date-day').show();
      $('#current-date-week').hide();
      calendarHead.append('<th>Time</th>');
      courts.forEach(court => {
        const sport = sports.find(s => s._id === court.sport);
        if (sport) {
          calendarHead.append(`<th>${sport.name}<br>${court.name}</th>`);
        }
      });

      timeSlots.forEach(time => {
        const row = $('<tr></tr>');
        row.append(`<td>${time}</td>`);
        courts.forEach(() => {
          row.append('<td class="open-slot" style="cursor: pointer;">+</td>');
        });
        calendarBody.append(row);
      });

      bookings.forEach(function (booking) {
        const court = courts.find(court => court._id === booking.court);
        if (!court) return; // If court is not found, skip this booking

        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);

        // Calculate the position and length of the booking block based on the start and end times
        const startHour = startTime.getHours();
        const endHour = endTime.getHours();
        const duration = endHour - startHour;

        // Find the cell corresponding to the court and start time
        const sport = sports.find(s => s._id === court.sport);
        const courtColumn = sport ? $(`th:contains(${sport.name}<br>${court.name})`).index() : -1;
        if (courtColumn === -1) return;

        const timeRow = $(`td:contains(${startHour} am), td:contains(${startHour} pm)`).closest('tr');

        // Add the booking block to the calendar
        for (let i = 0; i < duration; i++) {
          const currentRow = timeRow.nextAll().eq(i);
          const cell = currentRow.children().eq(courtColumn);
          cell.addClass('booked').append(`<div class="booking-block">${booking.userName}</div>`);
        }
      });
    } else if (view === 'weekly') {
      $('#current-date-day').hide();
      $('#current-date-week').show();
      calendarHead.append('<th>Date</th>');
      courts.forEach(court => {
        const sport = sports.find(s => s._id === court.sport);
        if (sport) {
          calendarHead.append(`<th>${sport.name}<br>${court.name}</th>`);
        }
      });

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const formattedDate = date.toLocaleDateString(undefined, options);

        const row = $('<tr></tr>');
        row.append(`<td>${formattedDate}</td>`);
        courts.forEach(() => {
          row.append('<td><div class="time-slot"></div></td>');
        });
        calendarBody.append(row);
      }

      bookings.forEach(function (booking) {
        const court = courts.find(court => court._id === booking.court);
        if (!court) return; // If court is not found, skip this booking

        const startTime = new Date(booking.startTime);
        const bookingDate = startTime.toLocaleDateString(undefined, options);

        // Find the cell corresponding to the court and date
        const sport = sports.find(s => s._id === court.sport);
        const courtColumn = sport ? $(`th:contains(${sport.name}<br>${court.name})`).index() : -1;
        if (courtColumn === -1) return;

        const dateRow = $(`td:contains(${bookingDate})`).closest('tr');
        const cell = dateRow.children().eq(courtColumn);
        cell.addClass('booked').append(`<div class="booking-block">${booking.userName}</div>`);
      });
    }
  }

  // Add New Sport
  $('#saveSport').on('click', function () {
    const sportName = $('#sportName').val();

    $.ajax({
      url: '/api/add-sport',
      method: 'POST',
      headers: { 'organizationName': organizationName },
      contentType: 'application/json',
      data: JSON.stringify({ name: sportName }),
      success: function (response) {
        alert('Sport added successfully');
        $('#new_sports').modal('hide');
        loadSports(); // Reload sports without reloading the page
      },
      error: function (error) {
        alert('Error adding sport: ' + (error.responseJSON ? error.responseJSON.message : 'Unknown error'));
      }
    });
  });

  // Add New Court
  $('#saveCourt').on('click', function () {
    const sportId = $('#courtSportSelect').val();
    const courtName = $('#courtName').val();
    const price = $('#courtPrice').val();
    const startTime = $('#courtStartTime').val();
    const endTime = $('#courtEndTime').val();

    $.ajax({
      url: '/api/add-court',
      method: 'POST',
      headers: { 'organizationName': organizationName },
      contentType: 'application/json',
      data: JSON.stringify({ sportId, name: courtName, price, isActive: true, startTime, endTime }),
      success: function (response) {
        alert('Court added successfully');
        $('#new_court').modal('hide');
        loadCourts(sportId); // Reload courts without reloading the page
      },
      error: function (error) {
        alert('Error adding court: ' + (error.responseJSON ? error.responseJSON.message : 'Unknown error'));
      }
    });
  });

  // Fetch and populate the sports dropdown in add court modal and filter modal
  function loadSports() {
    $.ajax({
      url: '/api/sports',
      method: 'GET',
      headers: { 'organizationName': organizationName },
      success: function (response) {
        sports = response;
        console.log(sports);
        const test_sport = sports[0]._id;
        console.log(test_sport);
        localStorage.setItem('sportID', test_sport);
        $('#courtSportSelect').empty();
        $('#courtSportSelect').append('<option disabled selected>Select sports</option>'); // Add a default option
        $('#filter-sports-options').empty(); // Clear previous options
        
        sports.forEach(function (sport) {
          
          $('#courtSportSelect').append(new Option(sport.name, sport._id));
          const sportOption = `
            <div class="form-check">
              <div class="flex-align2 radio-btn-container">   
                <input class="form-check-input" type="radio" name="filterSports" id="filterSport-${sport._id}" value="${sport._id}">
                <label class="form-check-label" for="filterSport-${sport._id}">
                  ${sport.name}
                </label>
              </div>
            </div>
          `;
          $('#filter-sports-options').append(sportOption);
        });

        const sportsContainer = $('#sportsContainer');
        sportsContainer.empty();
        sports.forEach(function (sport) {
          const sportDiv = $(`
            <div class="col-md-6">
              <h5 class="font-weight-600 mb-2">${sport.name}</h5>
              <div class="card rounded team-table w-100">
                <table>
                  <thead>
                    <tr>
                      <th style="border-top: none;">Court</th>
                      <th style="border-top: none;">Active / Not</th>
                    </tr>
                  </thead>
                  <tbody id="courtsContainer-${sport._id}">
                    <!-- Dynamic Court List -->
                  </tbody>
                </table>
              </div>
            </div>
          `);
          sportsContainer.append(sportDiv);
          //localStorage.setItem('sportID', sport._id);
          loadCourts(sport._id);
        });

        if (sports.length > 0) {
          loadCourts(sports[0]._id); // Load courts for the first sport by default
        }
      },
      error: function (error) {
        console.error('Error fetching sports:', error);
      }
    });
  }

  // Function to fetch and load courts options based on selected sport
  function loadCourts(sportId) {
    $.ajax({
      url: `/api/courts/${sportId}`,
      method: 'GET',
      headers: { 'organizationName': organizationName },
      success: function (response) {
        console.log(response);
        courts = response; // Update the global courts array with the response

        const courtsContainer = $(`#courtsContainer-${sportId}`);
        courtsContainer.empty();
        $('#filter-court-select').empty(); // Clear previous options
        $('#filter-court-select').append('<option selected>All</option>'); // Add default "All" option

        courts.forEach(function (court) {
          const courtRow = $(`
            <tr>
              <td>${court.name}</td>
              <td>
                <label class="switch">
                  <input type="checkbox" class="toggleCheckbox" data-court-id="${court._id}" ${court.isActive ? 'checked' : ''}>
                  <span class="slider round"></span>
                </label>
              </td>
            </tr>
          `);
          courtsContainer.append(courtRow);

          const courtOption = `<option value="${court._id}">${court.name}</option>`;
          $('#filter-court-select').append(courtOption);
        });

        initializeCalendar(view); // Initialize calendar with the loaded courts
      },
      error: function (error) {
        console.error('Error fetching courts:', error);
      }
    });
  }

  // Load all courts for default calendar view
  function loadAllCourts() {
    console.log(organizationName);
    $.ajax({
      url: '/api/courts',
      method: 'GET',
      headers: { 'organizationName': organizationName },
      success: function (response) {
        console.log('Courts response:', response); // Debugging line
        courts = response;
        if (Array.isArray(courts)) {
          initializeCalendar(view); // Initialize calendar with the loaded courts
        } else {
          console.error('Error: Courts is not an array', courts);
        }
      },
      error: function (error) {
        console.error('Error fetching all courts:', error);
      }
    });
  }

  // Initial load of sports and courts
  loadSports();

  // Fetch and populate the users dropdown in add booking modal
  function loadUsers() {
    $.ajax({
      url: '/api/users',
      method: 'GET',
      headers: { 'organizationName': organizationName },
      success: function (response) {
        users = response;
        const userSelect = $('#userSelect');
        userSelect.empty();
        userSelect.append('<option disabled selected>Select user</option>');
        users.forEach(function (user) {
          const option = $('<option></option>').attr('value', user._id).text(`${user.firstName} ${user.lastName}`);
          userSelect.append(option);
        });
        userSelect.append('<option value="add-new-user">Add new user</option>');
      },
      error: function (error) {
        console.error('Error fetching users:', error);
      }
    });
  }

  // Event listener for sport selection change in filter modal
  $(document).on('change', 'input[name="filterSports"]', function () {
    const sportId = $(this).val();
    filteredSportId = sportId; // Capture the filtered sport ID
    loadCourts(sportId);
  });

  // Event listener for applying the filter
  $('#applyFilterButton').click(function () {
    const selectedSport = $('input[name="filterSports"]:checked').val();
    const selectedCourt = $('#filter-court-select').val();
    updateCalendarView(selectedSport, selectedCourt);
    $('.bs-canvas-filter').removeClass('open_canvas'); // Close the filter canvas
    $('.bs-canvas-overlay').remove(); // Remove overlay
  });

  // Function to update calendar view
  function updateCalendarView(sportId, courtId) {
    $.ajax({
      url: '/api/bookings',
      headers: { 'organizationName': organizationName },
      method: 'GET',
      success: function (response) {
        $('.calendar .booking-block').remove();

        const filteredBookings = response.filter(function (booking) {
          return booking.sportId === sportId && (courtId === 'All' || booking.courtId === courtId);
        });

        filteredBookings.forEach(function (booking) {
          const court = courts.find(court => court._id === booking.court);
          if (!court) return; // If court is not found, skip this booking

          const startTime = new Date(booking.startTime);
          const endTime = new Date(booking.endTime);

          const startHour = startTime.getHours();
          const endHour = endTime.getHours();
          const duration = endHour - startHour;

          const sport = sports.find(s => s._id === court.sport);
          const courtColumn = sport ? $(`th:contains(${sport.name}<br>${court.name})`).index() : -1;
          if (courtColumn === -1) return;

          const timeRow = $(`td:contains(${startHour} am), td:contains(${startHour} pm)`).closest('tr');

          for (let i = 0; i < duration; i++) {
            const currentRow = timeRow.nextAll().eq(i);
            const cell = currentRow.children().eq(courtColumn);
            cell.addClass('booked').append(`<div class="booking-block">${booking.userName}</div>`);
          }
        });

        if (courtId === 'All') {
          const courtHeaders = courts.filter(court => court.sport._id === sportId).map(court => `<th>${court.sport.name}<br>${court.name}</th>`).join('');
          $('.calendar thead tr').html(`<th>Time</th>${courtHeaders}`);
        } else {
          const court = courts.find(court => court._id === courtId);
          $('.calendar thead tr').html(`<th>Time</th><th>${court.sport.name}<br>${court.name}</th>`);
        }
      },
      error: function (error) {
        console.error('Error fetching bookings:', error);
      }
    });
  }

  $(document).on('change', '.toggleCheckbox', function () {
    const courtId = $(this).data('court-id');
    const isActive = $(this).is(':checked');
    $.ajax({
      url: `/api/update-court/${courtId}`,
      method: 'PUT',
      headers: { 'organizationName': organizationName },
      contentType: 'application/json',
      data: JSON.stringify({ isActive }),
      success: function (response) {
        console.log('Court updated successfully');
      },
      error: function (error) {
        console.error('Error updating court:', error);
      }
    });
  });

  // Handle dynamic changes for dropdowns
  $(document).on('click', '.pull-bs-canvas-right, .pull-bs-canvas-filter', function () {
    $('body').prepend('<div class="bs-canvas-overlay bg-dark position-fixed w-100 h-100"></div>');
    if ($(this).hasClass('pull-bs-canvas-right'))
      $('.bs-canvas-right').addClass('open_canvas');
    else
      $('.bs-canvas-filter').addClass('open_canvas');
    return false;
  });

  $(document).on('click', '.bs-canvas-close, .bs-canvas-overlay', function () {
    var elm = $(this).hasClass('bs-canvas-close') ? $(this).closest('.bs-canvas') : $('.bs-canvas');
    elm.removeClass('open_canvas');
    $('.bs-canvas-overlay').remove();
    return false;
  });

  // Toggle between active and not active states
  document.addEventListener('DOMContentLoaded', function () {
    const toggleCheckboxes = document.querySelectorAll('.toggleCheckbox');
    const activeGame = document.getElementById('active-game');
    const notActiveGame = document.getElementById('not-active-game');

    toggleCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
          activeGame.style.display = 'block';
          notActiveGame.style.display = 'none';
        } else {
          activeGame.style.display = 'none';
          notActiveGame.style.display = 'block';
        }
      });

      // Trigger the change event to set the initial state correctly
      checkbox.dispatchEvent(new Event('change'));
    });
  });

  // Calculate and update the total amount on the new booking modal
  function updateTotalAmount() {
    const price = parseFloat($('#court-select option:selected').data('price')) || 0;
    const discount = parseFloat($('#discountAmount').val()) || 0;
    const total = price - discount;
    $('#totalAmount').text(`$${total.toFixed(2)}`);
  }

  // Fetch and populate courts and prices in the new booking modal
  function loadCourtsForBooking() {
    $.ajax({
      url: '/api/courts',
      method: 'GET',
      headers: { 'organizationName': organizationName },
      success: function (response) {
        courts = response;
        console.log('Courts:', courts);
        $('#court-select').empty();
        $('#court-select').append('<option disabled selected>Select court</option>');
        courts.forEach(function (court) {
          const sport = sports.find(s => s._id === court.sport);
          const option = $(`<option></option>`).attr('value', court._id).text(`${sport ? sport.name : 'Unknown Sport'} - ${court.name} | $${court.price}/hr`).data('price', court.price).data('sport', court.sport);
          $('#court-select').append(option);
        });
        updateTotalAmount(); // Update the total amount on initial load
      },
      error: function (error) {
        console.error('Error fetching courts:', error);
      }
    });
  }

  // Event listener for court selection change in the new booking modal
  $('#court-select').change(updateTotalAmount);

  // Event listener for discount input change in the new booking modal
  $('#discountAmount').change(updateTotalAmount);

  // Load courts and prices when the new booking modal is opened
  $('#new_booking').on('show.bs.modal', function () {
    loadCourtsForBooking();
    $('#sportSelect').val(filteredSportId); // Set the sport ID in the new booking modal
  });

  // Event listener for clicking on calendar cells to open the new booking modal
  $(document).on('click', '.calendar td.open-slot', function () {
    const courtName = $(this).closest('table').find('thead th').eq($(this).index()).text().split('<br>')[1];
    const sportName = $(this).closest('table').find('thead th').eq($(this).index()).text().split('<br>')[0];
    const timeSlot = $(this).closest('tr').find('td:first-child').text().trim();
    $('#court-select option').filter(function () {
      return $(this).text().includes(`${sportName} - ${courtName}`);
    }).prop('selected', true);
    $('#startTime').val(timeSlot.split(' ')[0] + ':00');
    $('#endTime').val((parseInt(timeSlot.split(' ')[0]) + 1) + ':00');
    $('#new_booking').modal('show');
  });

  $('#new_booking').on('show.bs.modal', function () {
    loadUsers();
    loadSports();
    $('#sportSelect').val(filteredSportId); // Set the sport ID in the new booking modal
  });

  // Event listener for saving the booking
  $('#saveBooking').click(function () {
    const courtId = $('#court-select').val();
    const userId = $('#userSelect').val();
    //const sportId = localStorage.getItem('sportId');
    const sportId = '66b1d762bf1879e89acdd684';
    const bookingDate = $('#startDate').val(); // New field for booking date
    const startTime = $('#startTime').val();
    const endTime = $('#endTime').val();
    const paymentType = $('#paymentType').val();
    const bookingNote = $('#bookingNote').val();
    const discountAmount = $('#discountAmount').val() || 0;
    const totalAmount = parseFloat($('#totalAmount').text().substring(1)) || 0;
    
    if (!courtId || !userId || !sportId || !bookingDate || !startTime || !endTime) {
      console.log(courtId, userId, sportId, bookingDate, startTime, endTime);

      
      alert('Please fill all required fields.');
      return;
    }

    $.ajax({
      url: '/api/add-booking',
      method: 'POST',
      headers: { 'organizationName': organizationName },
      contentType: 'application/json',
      data: JSON.stringify({
        courtId,
        userId,
        sportId, // Include sportId in the request
        bookingDate, // Include booking date
        startTime,
        endTime,
        paymentType,
        bookingNote,
        discountAmount,
        totalAmount
      }),
      success: function (response) {
        alert('Booking added successfully');
        $('#new_booking').modal('hide');
        loadBookings();
      },
      error: function (error) {
        alert('Error adding booking: ' + (error.responseJSON ? error.responseJSON.message : 'Unknown error'));
      }
    });
  });

  // Show add user modal if user is not found
  $('#userSelect').change(function () {
    const userId = $(this).val();
    if (userId === 'add-new-user') {
      // Show add user modal
      $('#new_user').modal('show');
    }
  });

  // Add new user from modal
  $('#saveUser').click(function () {
    const userName = $('#newUserName').val();
    const userEmail = $('#newUserEmail').val();
    const userPhone = $('#newUserPhone').val();

    if (!userName || !userEmail || !userPhone) {
      alert('Please fill all required fields.');
      return;
    }

    $.ajax({
      url: '/api/add-user',
      method: 'POST',
      headers: { 'organizationName': organizationName },
      contentType: 'application/json',
      data: JSON.stringify({
        name: userName,
        email: userEmail,
        phone: userPhone
      }),
      success: function (response) {
        alert('User added successfully');
        $('#new_user').modal('hide');
        loadUsers();
      },
      error: function (error) {
        alert('Error adding user: ' + (error.responseJSON ? error.responseJSON.message : 'Unknown error'));
      }
    });
  });
});
