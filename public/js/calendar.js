$(document).ready(function () {
  const userId = localStorage.getItem('booking-userid');
  
  if (!userId) {
    alert('User ID is missing. Please log in again.');
    return;
  }
  const accessToken = localStorage.getItem('booking-token');
  var token = `Bearer ${accessToken}`;
  var availableSlots = {};
  var selectedVenueId = null;
  var facilities = []; // Global variable to store facilities

  console.log('User ID:', userId);
  console.log('Access Token:', accessToken);

  function formatDate(date) {
    var options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('en-US', options);
  }

  // Debounce function to limit the rate of API calls
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function loadVenues() {
    $.ajax({
      url: 'https://booking.hwzthat.com/api/get_all_venues',
      type: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        "venue_name": "",
        "venue_status": "active"
      }),
      success: function (data) {
        if (data.status === 'Success') {
          var venues = data.result;
          venues.sort(function (a, b) {
            return a.venue_name.localeCompare(b.venue_name);
          });

          var venueOptions = $('#venue-options');
          var bookingTypes = $('#booking-types');
          venueOptions.empty();
          bookingTypes.empty();

          venues.forEach(function (venue) {
            var venueOption = $('<div class="flex-align2 radio-btn-container">')
              .append($('<input>')
                .attr('id', `venue-${venue.venue_id}`)
                .attr('type', 'radio')
                .attr('name', 'venue')
                .attr('value', venue.venue_id)
                .on('change', function () {
                  selectedVenueId = venue.venue_id;
                  debounce(loadFacilityNames(venue.venue_id), 300); // Debounced call
                })
              )
              .append($('<label>')
                .attr('for', `venue-${venue.venue_id}`)
                .text(venue.venue_name)
              );
            venueOptions.append(venueOption);

            var bookingTypeOption = $('<div class="flex-align2">')
              .append($('<input>')
                .attr('id', `booking-type-${venue.venue_id}`)
                .attr('type', 'radio')
                .attr('name', 'booking_type')
                .attr('value', venue.venue_name)
                .addClass('cursor-pointer')
              )
              .append($('<label>')
                .attr('for', `booking-type-${venue.venue_id}`)
                .addClass('text-12 m-0 cursor-pointer pl-1')
                .text(venue.venue_name)
              );
            bookingTypes.append(bookingTypeOption);
          });
          venueOptions.find('input').first().prop('checked', true).change();
          bookingTypes.find('input').first().prop('checked', true);
        } else {
          console.error('Failed to fetch venues:', data.errormessage);
        }
      },
      error: function (err) {
        console.error('Error fetching venues:', err);
      }
    });
  }

  function loadFacilityNames(venueId) {
    $.ajax({
      url: 'https://booking.hwzthat.com/api/get_all_facilities',
      type: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        "venue_id": venueId,
        "facility_id": ""
      }),
      success: function (data) {
        if (data.status === 'Success') {
          facilities = data.result;
          facilities.sort(function (a, b) {
            return naturalCompare(a.facility_name, b.facility_name);
          });

          var facilityOptions = $('#court');
          facilityOptions.empty();

          var facilityNamesHtml = ''; // Declare facilityNamesHtml here

          facilities.forEach(function (facility) {
            if (facility.facility_status === 'active') {
              facilityOptions.append(`<option value="${facility.facility_id}">${facility.facility_name}</option>`);
              facilityNamesHtml += `<th>${facility.facility_name}</th>`; // Append facility names to the HTML
            }
          });

          $('#facility-names').html(`<tr><th class="w-fit-content">Time</th>${facilityNamesHtml}</tr>`);
          $('#facility-names-weekly').html(`<tr><th class="w-fit-content">Date</th>${facilityNamesHtml}</tr>`);

          loadBookings();
          loadWeeklyBookings(new Date()); // Load weekly bookings as well
        } else {
          console.error('Failed to fetch facilities:', data.errormessage);
        }
      },
      error: function (err) {
        console.error('Error fetching facilities:', err);
      }
    });
  }

  function naturalCompare(a, b) {
    var ax = [], bx = [];

    a.replace(/(\d+)|(\D+)/g, function (_, $1, $2) {
      ax.push([$1 || Infinity, $2 || ""]);
    });
    b.replace(/(\d+)|(\D+)/g, function (_, $1, $2) {
      bx.push([$1 || Infinity, $2 || ""]);
    });

    while (ax.length && bx.length) {
      var an = ax.shift();
      var bn = bx.shift();
      var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if (nn) return nn;
    }

    return ax.length - bx.length;
  }

  function loadAvailableSlots(courtId, callback) {
    const currentDate = new Date().toISOString().split('T')[0];

    $.ajax({
      url: 'https://booking.hwzthat.com/api/get_available_slots',
      type: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        "facility_id": courtId,
        "booking_date": currentDate
      }),
      success: function (data) {
        console.log(`Available slots for court ${courtId}:`, data);
        if (data.status === 'Success') {
          availableSlots[courtId] = data.result;
          if (callback) callback();
        } else {
          console.error('Failed to fetch available slots:', data.errormessage);
        }
      },
      error: function (err) {
        console.error('Error fetching available slots:', err);
      }
    });
  }

  function loadBookings(date = new Date()) {
    const currentDate = date.toISOString().split('T')[0];
    var bookingData = new FormData();
    bookingData.append('user_id', "");
    bookingData.append('booking_date', currentDate);

    console.log('Fetching bookings for date:', currentDate);

    $.ajax({
      url: 'https://booking.hwzthat.com/api/get_user_bookings',
      type: 'POST',
      headers: {
        'Authorization': token,
      },
      processData: false,
      contentType: false,
      data: bookingData,
      success: function (data) {
        console.log('Received bookings:', data);

        if (data.status !== "Success") {
          console.error('Failed to fetch bookings:', data.errormessage);
          return;
        }

        var bookingSlotsHtml = '';
        for (var hour = 7; hour <= 21; hour++) {
          bookingSlotsHtml += '<tr><td class="w-fit-content">' + (hour < 12 ? hour + ' AM' : (hour - 12) + ' PM') + '</td>';
          facilities.forEach(function (facility) {
            bookingSlotsHtml += '<td id="slot-' + hour + '-court-' + facility.facility_id + '" class="available" data-hour="' + hour + '" data-court="' + facility.facility_id + '"></td>';
          });
          bookingSlotsHtml += '</tr>';
        }
        $('#booking-slots').html(bookingSlotsHtml);

        data.result.forEach(function (booking) {
          if (!booking.booking_lines || !booking.booking_lines.length) {
            console.error('No booking lines for booking:', booking);
            return;
          }

          booking.booking_lines.forEach(function (bookingLine) {
            if (bookingLine.venue_id === selectedVenueId) {
              var startHour = parseInt(bookingLine.slot.slot_title.split(' ')[0].split('pm')[0].split('am')[0]) + (bookingLine.slot.slot_title.includes('pm') && !bookingLine.slot.slot_title.includes('12') ? 12 : 0);
              var endHour = startHour + 1;
              var courtKey = bookingLine.facility_id;

              for (var hour = startHour; hour < endHour; hour++) {
                var slotId = '#slot-' + hour + '-court-' + courtKey;
                var slotElement = $(slotId);
                if (slotElement.length) {
                  fetchUserProfile(booking.user_id, function (user) {
                    updateSlotElementWithPaymentStatus(slotElement, booking, bookingLine, user);
                  });
                }
              }
            }
          });
        });

        $('.available').each(function () {
          if ($(this).hasClass('booked')) {
            $(this).css('cursor', 'not-allowed');
          } else {
            $(this).css('cursor', 'pointer');
          }
        });

        $('.available').mouseenter(function () {
          if (!$(this).hasClass('booked')) {
            $(this).html('<img src="images/add.png" alt="Plus Icon" style="width: 16px; height: 16px;">');
          }
        }).mouseleave(function () {
          if (!$(this).hasClass('booked')) {
            $(this).html('');
          }
        });

        $('.available').click(function () {
          if ($(this).hasClass('booked')) {
            return;
          }
          var hour = $(this).data('hour');
          var court = $(this).data('court');
          var date = $('#current-date').text();

          if (!availableSlots[court]) {
            loadAvailableSlots(court, function () {
              handleAvailableSlotClick(hour, court, date);
            });
          } else {
            handleAvailableSlotClick(hour, court, date);
          }
        });
      },
      error: function (err) {
        console.error('Error loading bookings:', err);
      }
    });

    loadWeeklyBookings(date);
  }

  function updateSlotElementWithPaymentStatus(slotElement, booking, bookingLine, user) {
    fetchPaymentStatus({
      user_id: booking.user_id,
      venue_id: bookingLine.venue_id,
      facility_id: bookingLine.facility_id,
      slot_id: bookingLine.slot_id,
      booking_dates: booking.booking_dates,
      booking_type: booking.booking_type,
      booking_total: booking.booking_total
    }).then(paymentData => {
      console.log('Payment data:', paymentData);
      let paymentStatus = paymentData.result && paymentData.result.status ? paymentData.result.status : 'Cash';
      if (!paymentStatus) {
        paymentStatus = 'Cash';
      }
      slotElement.html('<div class="booking-item" data-booking-id="' + booking.booking_id + '" data-venue="' + booking.booking_type + '" data-court="' + bookingLine.facility_id + '" data-start-time="' + bookingLine.slot.slot_start_time + '" data-end-time="' + bookingLine.slot.slot_end_time + '">' +
        '<h5>' + user.name + '</h5>' +
        '<p>' + bookingLine.slot.slot_start_time + ' - ' + bookingLine.slot.slot_end_time + '</p>' +
        '<p>' + (bookingLine.booking_addons.map(a => a.booking_addon_title).join(', ')) + '</p>' +
        '<p>Payment Status: ' + paymentStatus + '</p>' +
        '</div>').removeClass('available').addClass('booked');
    }).catch(err => {
      console.error('Failed to fetch payment status:', err);
      slotElement.html('<div class="booking-item" data-booking-id="' + booking.booking_id + '" data-venue="' + booking.booking_type + '" data-court="' + bookingLine.facility_id + '" data-start-time="' + bookingLine.slot.slot_start_time + '" data-end-time="' + bookingLine.slot.slot_end_time + '">' +
        '<h5>' + user.name + '</h5>' +
        '<p>' + bookingLine.slot.slot_start_time + ' - ' + bookingLine.slot.slot_end_time + '</p>' +
        '<p>' + (bookingLine.booking_addons.map(a => a.booking_addon_title).join(', ')) + '</p>' +
        '<p>Payment Status: Cash</p>' +
        '</div>').removeClass('available').addClass('booked');
    });
  }

  function loadWeeklyBookings(startDate) {
    var weekDatesHtml = '<tr><th class="w-fit-content"></th>';
    var dates = [];
    for (var i = 0; i < 7; i++) {
        var date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
        weekDatesHtml += `<th>${formatDate(date)}</th>`;
    }
    //weekDatesHtml += '</tr>';
    //$('#facility-names-weekly').html(weekDatesHtml);

    var bookingSlotsHtml = '';
    dates.forEach(function (date) {
        bookingSlotsHtml += '<tr><td class="w-fit-content">' + formatDate(date) + '</td>';
        facilities.forEach(function (facility) {
            bookingSlotsHtml += `<td id="slot-${facility.facility_id}-${date.toISOString().split('T')[0]}" data-date="${date.toISOString().split('T')[0]}" data-facility="${facility.facility_id}"></td>`;
        });
        bookingSlotsHtml += '</tr>';
    });
    $('#booking-slots-week').html(bookingSlotsHtml);

    dates.forEach(function (date) {
        loadBookingsForDate(date);
    });
}

function loadBookingsForDate(date) {
    const currentDate = date.toISOString().split('T')[0];
    var bookingData = new FormData();
    bookingData.append('user_id', "");
    bookingData.append('booking_date', currentDate);

    $.ajax({
        url: 'https://booking.hwzthat.com/api/get_user_bookings',
        type: 'POST',
        headers: {
            'Authorization': token,
        },
        processData: false,
        contentType: false,
        data: bookingData,
        success: function (data) {
            if (data.status !== "Success") {
                console.error('Failed to fetch bookings:', data.errormessage);
                return;
            }

            data.result.forEach(function (booking) {
                if (!booking.booking_lines || !booking.booking_lines.length) {
                    console.error('No booking lines for booking:', booking);
                    return;
                }

                booking.booking_lines.forEach(function (bookingLine) {
                    if (bookingLine.venue_id === selectedVenueId) {
                        var slotId = `#slot-${bookingLine.facility_id}-${currentDate}`;
                        var slotElement = $(slotId);
                        if (slotElement.length) {
                            var bookingItemHtml = `<div class="booking-item">
                                <p>${bookingLine.slot.slot_start_time} - ${bookingLine.slot.slot_end_time}</p>
                            </div>`;
                            slotElement.append(bookingItemHtml).addClass('booked');
                        }
                    }
                });
            });
        },
        error: function (err) {
            console.error('Error loading bookings:', err);
        }
    });
}

  function handleAvailableSlotClick(hour, court, date) {
    var slot = availableSlots[court]?.find(slot => {
      var slotHour = parseInt(slot.slot_title.split(' ')[0].split('pm')[0].split('am')[0]) + (slot.slot_title.includes('pm') && !slot.slot_title.includes('12') ? 12 : 0);
      return slotHour === hour;
    });
    var slotId = slot?.slot_id;

    if (!slotId) {
      alert('No available slot found for the selected time.');
      return;
    }

    $('#start-time').val((hour < 10 ? '0' : '') + hour + ':00');
    $('#end-time').val((hour < 10 ? '0' : '') + (hour + 1) + ':00');
    $('#start-date').val(date);
    $('#end-date').val(date);
    $('#court').val('Court ' + court);

    localStorage.setItem('slotId', slotId);

    $('#new_booking').modal('show');
  }

  function fetchUserProfile(userId, callback) {
    $.ajax({
      url: 'https://booking.hwzthat.com/api/get_user_profile',
      type: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ user_id: userId }),
      success: function (data) {
        if (data.status === 'Success') {
          callback(data.result);
        } else {
          console.error('Failed to fetch user profile:', data.errormessage);
          callback({ name: 'Unknown' });
        }
      },
      error: function (err) {
        console.error('Error fetching user profile:', err);
        callback({ name: 'Unknown' });
      }
    });
  }

  function fetchBookingDetails(bookingId, venue, court, startTime, endTime) {
    const bookingDetailsUrl = 'https://booking.hwzthat.com/api/get_user_bookings';
    const userProfileUrl = 'https://booking.hwzthat.com/api/get_user_profile';

    $.ajax({
      url: bookingDetailsUrl,
      type: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ booking_id: bookingId }),
      success: function (data) {
        if (data.status === 'Success') {
          const booking = data.result;

          $.ajax({
            url: userProfileUrl,
            type: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            data: JSON.stringify({ user_id: userId }),
            success: function (profileData) {
              if (profileData.status === 'Success') {
                const user = profileData.result;

                if (!user) {
                  console.error('User profile is null');
                  alert('Error fetching user profile');
                  return;
                }

                const modalBody = `
                  <div class="modal-header modal-header-custom">
                    <h5 class="modal-title">${venue} | Court ${court}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div class="modal-body modal-body-custom">
                    <div class="user-info">
                      <img src="https://via.placeholder.com/60" alt="${user.name}">
                      <div>
                        <h5>${user.name || 'Not available'}</h5>
                        <div class="user-contact">
                          <i class="fa fa-envelope"></i> ${user.email || 'Not available'}
                        </div>
                        <div class="user-contact">
                          <i class="fa fa-phone"></i> ${user.phone_number || 'Not available'}
                        </div>
                      </div>
                    </div>
                    <hr>
                    <div class="booking-details">
                      <h5>Schedule details</h5>
                      <div class="details-row">
                        <div>
                          <h6>Venue</h6>
                          <p>${venue || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>Court</h6>
                          <p>${court || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>Start date</h6>
                          <p>${booking.booking_date || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>End date</h6>
                          <p>${booking.booking_date || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>Start time</h6>
                          <p>${startTime || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>End time</h6>
                          <p>${endTime || 'Not available'}</p>
                        </div>
                      </div>
                      <hr>
                      <h5>Payment</h5>
                      <div class="details-row">
                        <div>
                          <h6>Payment type</h6>
                          <p>${booking.payment_type || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>Payment amount</h6>
                          <p>${booking.payment_amount || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>Status</h6>
                          <p class="payment-status">${booking.payment_status || 'Not available'}</p>
                        </div>
                        <div>
                          <h6>Booking status</h6>
                          <p class="status-pending">${booking.item_status || 'Not available'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
                $('#booking-details').html(modalBody);
                $('#booking-details-modal').modal('show');
              } else {
                console.error('Error fetching user profile:', profileData.errormessage);
                alert('Error fetching user profile');
              }
            },
            error: function (error) {
              console.error('Error fetching user profile:', error);
              alert('Error fetching user profile');
            }
          });
        } else {
          console.error('Error fetching booking details:', data.errormessage);
          alert('Error fetching booking details');
        }
      },
      error: function (error) {
        console.error('Error fetching booking details:', error);
        alert('Error fetching booking details');
      }
    });
  }

  function fetchPaymentStatus(booking) {
    console.log('Fetching payment status for booking:', booking);
    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'https://booking.hwzthat.com/api/checkout_payment_from_mobile',
        type: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          "user_id": booking.user_id,
          "venue_id": booking.venue_id,
          "facility_id": booking.facility_id,
          "slot_id": booking.slot_id,
          "booking_dataes": booking.booking_dates,
          "booking_type": booking.booking_type,
          "booking_total": booking.booking_total
        }),
        success: function (data) {
          console.log('Payment status response:', data);
          if (data.status === 'Success') {
            resolve(data);
          } else {
            reject('Payment status fetch failed');
          }
        },
        error: function (err) {
          console.error('Error fetching payment status:', err);
          reject('Error fetching payment status');
        }
      });
    });
  }

  $('#apply-filter').click(function () {
    var selectedVenueId = $('input[name="venue"]:checked').val();
    var selectedFacilityId = $('#court-options').val();
    debounce(loadFacilityNames(selectedVenueId), 300); // Debounced call
    if (selectedFacilityId !== "All") {
      loadBookingsForFacility(selectedFacilityId);
    } else {
      loadBookings();
    }
    $('.bs-canvas-close').click();
  });

  var currentDate = new Date();
  $('#current-date').text(formatDate(currentDate));

  // Initialize the datepicker
  $('#datepicker').datepicker({
    onSelect: function (dateText, inst) {
      var selectedDate = new Date(dateText + 'T00:00:00'); // Append time to ensure correct date
      $('#current-date').text(formatDate(selectedDate));
      loadBookings(selectedDate);
      loadWeeklyBookings(selectedDate); // Load weekly bookings as well
    },
    dateFormat: 'yy-mm-dd'
  });

  // Trigger the datepicker when the calendar icon is clicked
  $('#calendar-icon').click(function () {
    $('#datepicker').datepicker('show');
  });

  loadVenues();
  loadAvailableSlots(1);

  function updateSummary() {
    var startDate = $('#start-date').val();
    var endDate = $('#end-date').val();
    var startTime = $('#start-time').val();
    var endTime = $('#end-time').val();
    var discountValue = parseFloat($('#discount-value').val()) || 0;
    var ratePerHour = 60; // Assuming $60/hr
    var bookingTotal = calculateBookingTotal(startDate, endDate, startTime, endTime, ratePerHour);
    var totalWithDiscount = bookingTotal - discountValue;

    $('#booking-date-summary').text(`From: ${startDate} To: ${endDate}`);
    $('#booking-time-summary').text(`From: ${startTime} To: ${endTime}`);
    $('#booking-amount').text(`$${bookingTotal.toFixed(2)}`);
    $('#discount-amount').text(`$${discountValue.toFixed(2)}`);
    $('#total-amount').text(`$${totalWithDiscount.toFixed(2)}`);
  }

  function calculateBookingTotal(startDate, endDate, startTime, endTime, ratePerHour) {
    var start = new Date(`${startDate}T${startTime}`);
    var end = new Date(`${endDate}T${endTime}`);
    var hours = Math.abs(end - start) / 36e5; // Convert milliseconds to hours
    return hours * ratePerHour;
  }


    $('#add-discount').click(function() {
      $('#discount-value').toggle();
    });

    $('#new_booking').on('shown.bs.modal', function() {
      updateSummary();
    });

    // existing code
    $('#save-booking').click(function () {
      var slotId = localStorage.getItem('slotId');
      var bookingData = new FormData();
      var startDate = $('#start-date').val();
      var endDate = $('#end-date').val();
      var startTime = $('#start-time').val();
      var endTime = $('#end-time').val();
      var courtId = $('#court').val();
      var discountValue = parseFloat($('#discount-value').val()) || 0;
      var bookingTotal = calculateBookingTotal(startDate, endDate, startTime, endTime, 60); // Assuming $60/hr
      var totalWithDiscount = bookingTotal - discountValue;

      bookingData.append('booking_id', '');
      bookingData.append('start_date', startDate);
      bookingData.append('end_date', endDate);
      bookingData.append('venue_id', selectedVenueId);
      bookingData.append('facility_id', courtId);
      bookingData.append('slot_id', slotId);
      bookingData.append('user_id', userId); // Ensure user_id is not null
      bookingData.append('booking_dates', startDate);
      bookingData.append('booking_type', 'general_booking');
      bookingData.append('booking_total', totalWithDiscount);

      for (var pair of bookingData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if ($('#payment-type').val() === 'Card') {
        bookingData.append('payment_method', 'Card');
        $.ajax({
          url: 'https://booking.hwzthat.com/api/checkout_payment_from_mobile',
          type: 'POST',
          headers: {
            'Authorization': token,
          },
          processData: false,
          contentType: false,
          data: bookingData,
          success: function (data) {
            if (data.status === 'Success') {
              alert('Payment link generated successfully.');
              $('#new_booking').modal('hide');
              loadBookings();
              localStorage.removeItem('slotId');
            } else {
              console.error('Failed to generate payment link:', data.errormessage);
              alert(`Error: ${data.errormessage || 'Unknown error occurred'}`);
            }
          },
          error: function (err) {
            console.error('Error processing payment:', err);
            alert('An error occurred while trying to process the payment. Please try again later.');
          }
        });
      } else {
        $.ajax({
          url: 'https://booking.hwzthat.com/api/add_booking_by_date_range',
          type: 'POST',
          headers: {
            'Authorization': token,
          },
          processData: false,
          contentType: false,
          data: bookingData,
          success: function (data) {
            if (data.status === 'Success') {
              $('#new_booking').modal('hide');
              loadBookings();
              localStorage.removeItem('slotId');
            } else {
              console.error('Failed to save booking:', data.errormessage);
              alert(`Error: ${data.errormessage || 'Unknown error occurred'}`);
            }
          },
          error: function (err) {
            console.error('Error saving booking:', err);
            alert('An error occurred while trying to save the booking. Please try again later.');
          }
        });
      }
    });

  $('#cancel-booking').click(function () {
    // Implement cancel booking functionality here
  });

  // Event delegation for booked slots
  $(document).on('click', '.booked .booking-item', function () {
    var bookingId = $(this).data('booking-id');
    var venue = $(this).data('venue');
    var court = $(this).data('court');
    var startTime = $(this).data('start-time');
    var endTime = $(this).data('end-time');
    console.log('Opening booking details for booking ID:', bookingId);
    fetchBookingDetails(bookingId, venue, court, startTime, endTime);
  });
});
