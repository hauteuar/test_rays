$(document).ready(function () {
  let view = 'daily'; // Initialize the view variable
  let filteredSportId = null; // Initialize a variable to store the filtered sport ID
  let organizationId = localStorage.getItem('organizationId'); // Retrieve organizationId from local storage
  let sports = [];
  let allCourts = []; // Stores all courts across all sports
  let courtsBySport = {}; // Stores courts per sport as an object with sportId as key
  let bookings = [];
  let users = [];

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
    loadBookings(() => {
      initializeCalendar(view); // Re-initialize calendar after loading bookings
    });
  });

  function formatDate(date) {
    var options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('en-US', options);
  }
  function parseDate(dateString) {
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JavaScript
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
}

  // Initialize the datepicker and handle date selection
  $('#calendar-icon').click(function () {
    $('<input type="text" id="datepicker">').appendTo('body').datepicker({
      onSelect: function (dateText) {
        var selectedDate = parseDate(dateText);
        $('#current-date').text(formatDate(selectedDate)); // Update the current date display
        $(this).datepicker('destroy').remove(); // Destroy and remove the datepicker input
        loadBookings(() => {
          initializeCalendar(view, selectedDate); // Re-initialize calendar after loading bookings
        }, selectedDate);
      },
      dateFormat: 'yy-mm-dd' // Ensure the date format is consistent
    }).datepicker('show');
  });

  // Correct the loadBookings function to use the selected date
  function loadBookings(callback, selectedDate) {
    const dateToLoad = selectedDate || new Date(); // Default to current date if none selected
    $.ajax({
      url: '/api/book/bookings',
      method: 'GET',
      headers: { 'organizationId': organizationId },
      data: { date: dateToLoad.toISOString().split('T')[0] }, // Pass the selected date to the server
      success: function (response) {
        console.log('Booking Info:', response);
        bookings = response; // Store bookings globally
        if (typeof callback === 'function') callback();
      },
      error: function (error) {
        console.error('Error fetching bookings:', error);
      }
    });
  }

  // Correct the initializeCalendar function to accept selectedDate
  function initializeCalendar(view, selectedDate) {
    console.log('Initializing Calendar for date:', selectedDate);
    const timeSlots = ['8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm'];
    const calendarBody = $('.calendar tbody');
    const calendarHead = $('.calendar thead tr');
    calendarBody.empty();
    calendarHead.empty();

    if (view === 'daily') {
      $('#current-date-day').show();
      $('#current-date-week').hide();
      calendarHead.append('<th>Time</th>');
      allCourts.forEach(court => {
        const sport = sports.find(s => String(s._id) === String(court.sportId));
        if (sport) {
          calendarHead.append(`<th>${sport.name}<br>${court.name}</th>`);
        }
      });

      timeSlots.forEach(time => {
        const row = $('<tr></tr>');
        row.append(`<td>${time}</td>`);
        allCourts.forEach(() => {
          row.append('<td class="open-slot" style="cursor: url(\'images/plus-sign.png\'), pointer;"> </td>');
        });
        calendarBody.append(row);
      });

      bookings.forEach(function (booking) {
        console.log('Processing booking:', booking);

        const bookingCourtId = String(booking.courtId._id);
        const courtIndex = allCourts.findIndex(court => String(court._id) === bookingCourtId);

        if (courtIndex === -1) {
          console.log('Court not found for booking:', bookingCourtId);
          return;
        }

        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);
        const startHour = startTime.getUTCHours(); // Use UTC to avoid timezone issues
        const endHour = endTime.getUTCHours(); // Use UTC to avoid timezone issues
        const duration = endHour - startHour;

        const timeRowIndex = timeSlots.findIndex(slot => {
          const slotHour = parseInt(slot.split(' ')[0]) + (slot.includes('pm') && slot !== '12 pm' ? 12 : 0);
          return slotHour === startHour;
        });

        if (timeRowIndex === -1) {
          console.log('Time slot not found for booking:', startHour);
          return;
        }

        for (let i = 0; i < duration; i++) {
          const currentRow = calendarBody.find('tr').eq(timeRowIndex + i);
          const cell = currentRow.find('td').eq(courtIndex + 1); // +1 to account for the Time column
          cell.removeClass('open-slot')
            .addClass('booked')
            .css('background-color', 'red')
            .html(`<div class="booking-block" data-booking-id="${booking._id}" style="cursor: pointer;">
                                ${booking.userId.firstName} ${booking.userId.lastName}<br>${booking.paymentStatus}</div>`);
        }
      });

      $(document).on('click', '.booking-block', function () {
        const bookingId = $(this).data('booking-id');
        const bookingDetails = bookings.find(booking => booking._id === bookingId);
        if (bookingDetails) {
          alert(`Booking Details:\nUser: ${bookingDetails.userId.firstName} ${bookingDetails.userId.lastName}\nPayment: ${bookingDetails.paymentType}\nCourt: ${bookingDetails.courtId.name}\nStart: ${new Date(bookingDetails.startTime).toLocaleTimeString()}\nEnd: ${new Date(bookingDetails.endTime).toLocaleTimeString()}`);
        }
      });
    }
  }

  // Initialize the calendar for today's date on page load
  function initialize() {
    const currentDate = new Date();
    loadBookings(() => {
      initializeCalendar(view, currentDate);
    }, currentDate); // Load bookings for today by default
    $('#current-date').text(formatDate(currentDate)); // Display today's date
  }

  initialize(); // Run the initialization on page load
  function fetchUserProfile() {
    const token = localStorage.getItem('token');
    console.log('Token:', token);

    $.ajax({
      url: '/api/user/profile',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      success: function (response) {
        console.log('User Profile:', response);
        organizationId = response.organizationId;
        localStorage.setItem('organizationId', organizationId);
        console.log('Organization ID set:', organizationId);

        // Now that organizationId is set, load the necessary data
        loadSports(() => {
          loadAllCourts(() => {
            loadBookings(() => {
              initializeCalendar(view); // Initialize calendar after loading all necessary data
            });
          });
        });
        loadUsers();
      },
      error: function (error) {
        console.error('Error fetching user profile', error);
      }
    });
  }

  if (!organizationId) {
    fetchUserProfile(); // Fetch the user profile and set the organization ID
  } else {
    console.log('Organization ID from local storage:', organizationId);
    loadSports(() => {
      loadAllCourts(() => {
        loadBookings(() => {
          initializeCalendar(view); // Initialize calendar after loading all necessary data
        });
      });
    });
    loadUsers();
  }

  // Function to load bookings and display on the calendar
  function loadBookings(callback) {
    $.ajax({
      url: '/api/book/bookings',
      method: 'GET',
      headers: { 'organizationId': organizationId },
      success: function (response) {
        console.log('Booking Info:', response);
        bookings = response; // Store bookings globally
        if (typeof callback === 'function') callback();
      },
      error: function (error) {
        console.error('Error fetching bookings:', error);
      }
    });
  }

  // Initialize calendar with time slots
  function initializeCalendar(view) {
    console.log('Initializing Calendar with Courts:', allCourts);
    const timeSlots = ['8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm'];
    const calendarBody = $('.calendar tbody');
    const calendarHead = $('.calendar thead tr');
    calendarBody.empty();
    calendarHead.empty();

    if (view === 'daily') {
      $('#current-date-day').show();
      $('#current-date-week').hide();
      calendarHead.append('<th>Time</th>');
      allCourts.forEach(court => {
        const sport = sports.find(s => String(s._id) === String(court.sportId));
        if (sport) {
          calendarHead.append(`<th>${sport.name}<br>${court.name}</th>`);
        }
      });

      timeSlots.forEach(time => {
        const row = $('<tr></tr>');
        row.append(`<td>${time}</td>`);
        allCourts.forEach(() => {
          row.append('<td class="open-slot" style="cursor: url(\'images/plus-sign.png\'), pointer;"> </td>');
        });
        calendarBody.append(row);
      });

      bookings.forEach(function (booking) {
        console.log('Processing booking:', booking);
      
        const bookingCourtId = String(booking.courtId._id);
        const courtIndex = allCourts.findIndex(court => String(court._id) === bookingCourtId);
      
        if (courtIndex === -1) {
          console.log('Court not found for booking:', bookingCourtId);
          return;
        }
      
        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);
        const startHour = startTime.getHours();
        const endHour = endTime.getHours();
        const duration = endHour - startHour;
      
        const timeRowIndex = timeSlots.findIndex(slot => {
          const slotHour = parseInt(slot.split(' ')[0]) + (slot.includes('pm') && slot !== '12 pm' ? 12 : 0);
          return slotHour === startHour;
        });
      
        if (timeRowIndex === -1) {
          console.log('Time slot not found for booking:', startHour);
          return;
        }
      
        for (let i = 0; i < duration; i++) {
          const currentRow = calendarBody.find('tr').eq(timeRowIndex + i);
          const cell = currentRow.find('td').eq(courtIndex + 1); // +1 to account for the Time column
          cell.removeClass('open-slot')
              .addClass('booked')
              .css('background-color', 'red')
              .html(`<div class="booking-block" data-booking-id="${booking._id}" style="cursor: pointer;">
                      ${booking.userId.firstName} ${booking.userId.lastName}<br>${booking.paymentStatus}</div>`);
        }
      });
      

      // Add click event to show booking details
      $(document).on('click', '.booking-block', function () {
        const bookingId = $(this).data('booking-id');
        const bookingDetails = bookings.find(booking => booking._id === bookingId);
        if (bookingDetails) {
          // Show booking details in a modal or alert (you can customize this part)
          alert(`Booking Details:\nUser: ${bookingDetails.userId.firstName} ${bookingDetails.userId.lastName}\nPayment: ${bookingDetails.paymentType}\nCourt: ${bookingDetails.courtId.name}\nStart: ${new Date(bookingDetails.startTime).toLocaleTimeString()}\nEnd: ${new Date(bookingDetails.endTime).toLocaleTimeString()}`);
        }
      });
    } else if (view === 'weekly') {
      $('#current-date-day').hide();
      $('#current-date-week').show();
      calendarHead.append('<th>Date</th>');
      allCourts.forEach(court => {
        const sport = sports.find(s => String(s._id) === String(court.sportId));
        if (sport) {
          calendarHead.append(`<th>${sport.name}<br>${court.name}</th>`);
        }
      });

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const formattedDate = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const row = $('<tr></tr>');
        row.append(`<td>${formattedDate}</td>`);
        allCourts.forEach(() => {
          row.append('<td><div class="time-slot" style="background-color: red; height: 30px; cursor: pointer;"></div></td>');
        });
        calendarBody.append(row);
      }
    }
  }
  // Add New Sport
  $('#saveSport').on('click', function () {
    const sportName = $('#sportName').val();
    console.log('sport-org:', organizationId);
    $.ajax({
      url: `/api/sport/add-sport`,
      method: 'POST',
      headers: { 'organizationId': organizationId },
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
    const courtType = $('input[name="courtType"]:checked').val();
    const price = $('#courtPrice').val();
    const startTime = $('#courtStartTime').val();
    const endTime = $('#courtEndTime').val();

    $.ajax({
      url: '/api/sport/add-court',
      method: 'POST',
      headers: { 'organizationId': organizationId },
      contentType: 'application/json',
      data: JSON.stringify({ sportId, name: courtName, courtType, price, isActive: true, startTime, endTime }),
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
      url: '/api/sport/sports',
      method: 'GET',
      headers: { 'organizationId': organizationId },
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
      url: `/api/sport/courts/${sportId}`,
      method: 'GET',
      headers: { 'organizationId': organizationId },
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
  // Load sports and initialize sports dropdown
  function loadSports(callback) {
    $.ajax({
      url: '/api/sport/sports',
      method: 'GET',
      headers: { 'organizationId': organizationId },
      success: function (response) {
        sports = response;
        console.log('Sports:', sports);
        $('#courtSportSelect').empty();
        $('#courtSportSelect').append('<option disabled selected>Select sports</option>');
        $('#filter-sports-options').empty();

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
          loadCourtsForSport(sport._id); // Load courts for each sport
        });

        if (typeof callback === 'function') callback();
      },
      error: function (error) {
        console.error('Error fetching sports:', error);
      }
    });
  }

  // Load courts based on selected sport and store them separately
  function loadCourtsForSport(sportId) {
    $.ajax({
      url: `/api/sport/courts/${sportId}`,
      method: 'GET',
      headers: { 'organizationId': organizationId },
      success: function (response) {
        console.log('Courts for Sport:', sportId, response);
        courtsBySport[sportId] = response; // Store courts per sport

        const courtsContainer = $(`#courtsContainer-${sportId}`);
        courtsContainer.empty();
        $('#filter-court-select').empty();
        $('#filter-court-select').append('<option selected>All</option>');

        response.forEach(function (court) {
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
      },
      error: function (error) {
        console.error('Error fetching courts:', error);
      }
    });
  }

  // Load all courts for default calendar view
  function loadAllCourts(callback) {
    console.log('Loading all courts for organization:', organizationId);
    $.ajax({
      url: '/api/sport/courts',
      method: 'GET',
      headers: { 'organizationId': organizationId },
      success: function (response) {
        console.log('All Courts Response:', response);
        allCourts = response;
        if (Array.isArray(allCourts) && allCourts.length > 0) {
          console.log('All Courts Loaded:', allCourts);
        } else {
          console.error('Error: No courts found', allCourts);
        }
        if (typeof callback === 'function') callback();
      },
      error: function (error) {
        console.error('Error fetching all courts:', error);
      }
    });
  }

  // Load users for the selected organization
  function loadUsers() {
    $.ajax({
      url: `/api/user/${organizationId}`,
      method: 'GET',
      headers: { 'organizationId': organizationId },
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
    // Use courtsBySport to get courts for the selected sport
    const filteredCourts = courtsBySport[sportId] || [];
    // Update filter court select dropdown
    $('#filter-court-select').empty();
    $('#filter-court-select').append('<option selected>All</option>');
    filteredCourts.forEach(function (court) {
      const courtOption = `<option value="${court._id}">${court.name}</option>`;
      $('#filter-court-select').append(courtOption);
    });
  });

  // Event listener for applying the filter
  $('#applyFilterButton').click(function () {
    const selectedSport = $('input[name="filterSports"]:checked').val();
    const selectedCourt = $('#filter-court-select').val();
    updateCalendarView(selectedSport, selectedCourt);
    $('.bs-canvas-filter').removeClass('open_canvas'); // Close the filter canvas
    $('.bs-canvas-overlay').remove(); // Remove overlay
  });

  // Function to update calendar view based on filters
  function updateCalendarView(sportId, courtId) {
    const filteredCourts = courtId === 'All' ? (courtsBySport[sportId] || []) : allCourts.filter(court => court._id === courtId);
    if (filteredCourts.length === 0) {
      alert('No courts found for the selected filter.');
      return;
    }
    // Update the global allCourts variable temporarily for the calendar view
    const originalAllCourts = [...allCourts];
    allCourts = filteredCourts;
    initializeCalendar(view); // Re-initialize calendar with filtered courts

    // After re-initialization, revert allCourts to original
    allCourts = originalAllCourts;
  }

  $(document).on('change', '.toggleCheckbox', function () {
    const courtId = $(this).data('court-id');
    const isActive = $(this).is(':checked');
    $.ajax({
      url: `/api/sport/update-court/${courtId}`,
      method: 'PUT',
      headers: { 'organizationId': organizationId },
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

  // Event listener for clicking on calendar cells to open the new booking modal
  $(document).on('click', '.calendar td.open-slot', function () {
    const cellIndex = $(this).index();
    const timeRow = $(this).closest('tr');
    const timeSlot = timeRow.find('td:first-child').text().trim();
    const courtHeader = $('.calendar thead tr').find('th').eq(cellIndex).html();
    const [sportName, courtName] = courtHeader.split('<br>');
    
    // Pre-select court in booking modal
    const selectedCourt = allCourts.find(court => {
      const sport = sports.find(s => String(s._id) === String(court.sportId));
      return sport && sport.name === sportName && court.name === courtName;
    });
    


if (selectedCourt) {
  $('#court-select').val(selectedCourt._id);
  $('#sportId').val(selectedCourt.sportId); // Assuming you have an input or hidden field for sportId
  console.log(selectedCourt.sportId);
}
    $('#startTime').val(timeSlot);
    $('#endTime').val(timeSlot);
    $('#new_booking').modal('show');
  });



  $('#new_booking').on('show.bs.modal', function () {
    // Populate courts dropdown
    const courtSelect = $('#court-select');
    const sportId =  $('#sportId'); 
    courtSelect.empty();
    allCourts.forEach(court => {
      const sport = sports.find(s => String(s._id) === String(court.sportId));
      if (sport) {
        const optionText = `${sport.name} - ${court.name}`;
        courtSelect.append(new Option(optionText, court._id));
      }
    });
  });

    // Event listener for when a new court is selected in the booking modal
    $('#court-select').change(function () {
      const selectedCourtId = $(this).val();
      const selectedCourt = allCourts.find(court => String(court._id) === String(selectedCourtId));
      
      if (selectedCourt) {
        $('#sportId').val(selectedCourt.sportId); // Update sportId based on the selected court
        console.log('Updated Sport ID:', selectedCourt.sportId);
      }
    });
    // Event listener for when a new court is selected in the booking modal
  $('#court-select').change(function () {
    const selectedCourtId = $(this).val();
    const bookingDate = $('#startDate').val();
    const startTime = $('#startTime').val();
    const endTime = $('#endTime').val();

    if (!selectedCourtId || !bookingDate || !startTime || !endTime) {
      return; // Ensure all required fields are selected
    }

    // Fetch court price based on the selected court and time
    $.ajax({
      url: `/api/sport/court-price/${selectedCourtId}`,
      method: 'GET',
      headers: { 'organizationId': organizationId },
      success: function (response) {
        const courtPrices = response.prices; // Assuming response contains the court's pricing array
        const selectedDay = new Date(bookingDate).toLocaleString('en-US', { weekday: 'long' });

        // Calculate the booking price based on the day and time
        let totalAmount = 0;
        courtPrices.forEach(price => {
          if ((price.day === selectedDay || price.day === 'All') && startTime >= price.startTime && endTime <= price.endTime) {
            totalAmount += price.price * (1 - (price.discount / 100));
          }
        });

        // Display the calculated price
        $('#court-price').text(`$${totalAmount.toFixed(2)}`);
        $('#totalAmount').text(`$${totalAmount.toFixed(2)}`);
      },
      error: function (error) {
        console.error('Error fetching court price:', error);
        alert('Could not fetch court price.');
      }
    });
  });

  $('#saveBooking').click(function () {
    const courtId = $('#court-select').val();
    const sportId = $('#sportId').val();
    const userId = $('#userSelect').val();
    const bookingDate = $('#startDate').val();
    const startTime = $('#startTime').val();
    const endTime = $('#endTime').val();
    const paymentType = $('#paymentType').val();
    const bookingNote = $('#bookingNote').val();
    const discountAmount = parseFloat($('#discountAmount').val()) || 0;
    const totalAmount = parseFloat($('#totalAmount').text().substring(1)) || 0;
  
    if (!courtId || !userId || !sportId || !bookingDate || !startTime || !endTime || !organizationId) {
      alert('Please fill all required fields.');
      return;
    }
  
    // Format dates correctly
    const startDateTime = new Date(`${bookingDate}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${bookingDate}T${endTime}:00`).toISOString();
  
    $.ajax({
      url: '/api/book/add-booking',
      method: 'POST',
      headers: { 'organizationId': organizationId },
      contentType: 'application/json',
      data: JSON.stringify({
        courtId,
        userId,
        sportId,
        organizationId,
        startTime: startDateTime,
        endTime: endDateTime,
        paymentType,
        bookingNote,
        discountAmount,
        totalAmount,
        status: 'pending'
      }),
      success: function (response) {
        const transactionId = generateTransactionId('booking');
        saveTransactionId(response._id, transactionId, 'booking', totalAmount, paymentType);
        alert('Booking added successfully');
        $('#new_booking').modal('hide');
        //addToCart(response._id, totalAmount, courtId, sportId, userId, transactionId); // Add booking to cart with additional info
        loadBookings(() => {
          initializeCalendar(view);
        });
      },
      error: function (error) {
        alert('Error adding booking: ' + (error.responseJSON ? error.responseJSON.message : 'Unknown error'));
      }
    });
  });
  
  function generateTransactionId(itemType) {
    let prefix = '';
  
    switch (itemType) {
      case 'booking':
        prefix = 'bki_';
        break;
      case 'course':
        prefix = 'crs_';
        break;
      case 'ecom':
        prefix = 'com_';
        break;
      case 'combined':
        prefix = 'cmd_';
        break;
      default:
        prefix = 'txn_';
        break;
    }
  
    return prefix + Math.random().toString(36).substr(2, 9);
  }
  
  async function saveTransactionId(itemId, transactionId, itemType, amount, paymentMethod) {
    const saveData = {
      transactionId,
      userId: $('#userSelect').val(),
      organizationId: localStorage.getItem('organizationId'),
      itemType,
      itemId,
      amount,
      paymentMethod,  // Ensure paymentMethod is included
      paymentStatus: 'pending'
    };
  
    try {
      const response = await fetch('/api/payments/save-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });
  
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save transaction ID');
      }

      await addToCart(result.payment._id, itemId, amount, itemType, organizationId);

    } catch (error) {
      console.error('Error saving transaction ID:', error);
    }
  }
  
  async function addToCart(paymentId, itemId, price, itemType, organizationId) {
    //fetchUserProfile();
   // const organizationId = localStorage.getItem('organizationId'); 
    console.log('payment-org-id',paymentId, itemId, price, itemType, organizationId);

    const cartData = {
    paymentId,
    itemId,
    price,
    itemType,
    status: 'pending',
  };

  try {
    const userId = localStorage.getItem('userId');
    const organizationId = localStorage.getItem('organizationId'); 
    console.log(organizationId);
    
    const response = await fetch(`/api/cart/${userId}/add-item/${organizationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'organizationId': organizationId,
      },
      body: JSON.stringify(cartData),
    });

    const result = await response.json();
    if (!result.success) {
      console.error('Failed to add item to cart');
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
  }
}
async function updateCartIcon() {
  try {
    const userId = localStorage.getItem('userId'); // Assume you have stored the user's ID in localStorage
    const organizationId = localStorage.getItem('organizationId'); // Get organizationId from localStorage

    const response = await fetch(`/api/cart/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        'organizationId': organizationId,
      }
    });

    if (response.ok) {
      const cart = await response.json();
      const cartCount = cart.items.length;
      $('#cart-icon').text(cartCount); // Assuming there's a cart icon with ID 'cart-icon'
    } else {
      console.error('Failed to load cart data');
      $('#cart-icon').text(0); // Set to 0 if cart data cannot be loaded
    }
  } catch (error) {
    console.error('Error updating cart icon:', error);
    $('#cart-icon').text(0); // Set to 0 in case of error
  }
}

// Call this function on page load or after any cart update
document.addEventListener('DOMContentLoaded', updateCartIcon);

  
  // Show add user modal if user is not found
  $('#userSelect').change(function () {
    const userId = $(this).val();
    if (userId === 'add-new-user') {
      $('#new_user').modal('show');
    }
  });

  // Add new user from modal
  $('#saveUser').click(function () {
    const firstName = $('#newUserFirstName').val();
    const lastName = $('#newUserLastName').val();
    const email = $('#newUserEmail').val();

    if (!firstName || !lastName || !email) {
      alert('Please fill all required fields.');
      return;
    }

    $.ajax({
      url: '/api/user/add',
      method: 'POST',
      headers: { 'organizationId': organizationId },
      contentType: 'application/json',
      data: JSON.stringify({
        firstName,
        lastName,
        email
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
