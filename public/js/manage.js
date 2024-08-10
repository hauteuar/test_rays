$(document).ready(function () {
    var accessToken = localStorage.getItem('accessToken');
    const token = `Bearer ${accessToken}`;
    let currentFacility = {};
    console.log(token);
    function fetchVenues() {
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
                console.log('Venues:', data);
                if (data.status === 'Success') {
                    data.result.forEach(venue => {
                        fetchFacilities(venue);
                    });
                } else {
                    console.error('Failed to fetch venues:', data.errormessage);
                }
            },
            error: function (err) {
                console.error('Error fetching venues:', err);
            }
        });
    }

    function fetchFacilities(venue) {
        $.ajax({
            url: 'https://booking.hwzthat.com/api/get_all_facilities',
            type: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                "venue_id": venue.venue_id,
                "facility_id": ""
            }),
            success: function (data) {
                console.log(`Facilities for venue ${venue.venue_name}:`, data);
                if (data.status === 'Success') {
                    renderVenue(venue, data.result);
                } else {
                    console.error(`Failed to fetch facilities for venue ${venue.venue_name}:`, data.errormessage);
                }
            },
            error: function (err) {
                console.error(`Error fetching facilities for venue ${venue.venue_name}:`, err);
            }
        });
    }

    function renderVenue(venue, facilities) {
        let venueHtml = `
        <div class="col-md-5">
          <h5 class="font-weight-600 mb-2">${venue.venue_name}</h5>
          <div class="card rounded team-table w-100">
            <table>
              <thead>
                <tr>
                  <th style="border-top: none;">Court</th>
                  <th style="border-top: none;">Active / Not</th>
                </tr>
              </thead>
              <tbody>
                ${facilities.map(facility => `
                  <tr>
                    <td>${facility.facility_name}</td>
                    <td>
                      <div class="flex-align g4">
                        <div class="toggle toggle2" data-toggle="modal" data-target="#active_not" data-facility-id="${facility.facility_id}" data-venue-id="${facility.venue_id}" data-facility-name="${facility.facility_name}" data-facility-status="${facility.facility_status}">
                          <input type="checkbox" name="" class="toggleCheckbox" ${facility.facility_status === 'active' ? 'checked' : ''}>
                          <span class="toggle-bar"></span>
                        </div>
                        <div class="dropdown show" style="display: block;">
                          <img src="images/dots.png" class="dropdown-toggle cursor-pointer" style="width: 50px; height: 14px; object-fit: contain;" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                          <div class="dropdown-menu">
                            <a class="dropdown-item text-dark py-2 text-12" data-action="edit" data-facility-id="${facility.facility_id}" data-venue-id="${facility.venue_id}" data-facility-name="${facility.facility_name}" data-facility-status="${facility.facility_status}">Edit</a>
                            <a class="dropdown-item text-dark py-2 text-12" data-action="delete" data-facility-id="${facility.facility_id}" data-venue-id="${facility.venue_id}">Delete</a>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
        $('#venue-container').append(venueHtml);
    }

    fetchVenues();

    $(document).on('click', '.dropdown-item', function () {
        let action = $(this).data('action');
        let facilityId = $(this).data('facility-id');
        let venueId = $(this).data('venue-id');
        let facilityName = $(this).data('facility-name');
        let facilityStatus = $(this).data('facility-status');

        $.ajax({
            url: `https://booking.hwzthat.com/api/get_facility/${facilityId}`,
            type: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            success: function (data) {
                currentFacility = data.result;
                if (action === 'edit') {
                    $('#active_not').modal('show');
                    if (facilityStatus === 'active') {
                        $('#active-game').show();
                        $('#not-active-game').hide();
                        populateActiveModal(currentFacility);
                    } else {
                        $('#not-active-game').show();
                        $('#active-game').hide();
                        populateEditModal(currentFacility);
                    }
                } else if (action === 'delete') {
                    $('#view').modal('show');
                    populateViewModal(currentFacility);
                }
            },
            error: function (err) {
                console.error('Failed to fetch facility data:', err);
            }
        });
    });

    $('#save-status').on('click', function () {
        let facilityStatus = $('#active-game').is(':visible') ? 'active' : 'inactive';
        
        let startDate = $('#start-date').val();
        let endDate = $('#end-date').val();
        let reason = $('#reason').val();

        const requestData = {
            "Facility_id": 13,           
            "facility_status": "inactive"
        };
        
        console.log('Request Data:', requestData);
        
        $.ajax({
            url: 'https://booking.hwzthat.com/api/facility_status_change_api',
            type: 'POST',
            headers: {
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjUxOWFhMTMyMmE3NWM4NzJmZDU4Mzk3NTQzMzhlZjhmNmI3ODZlMTUxOWE1NzE2OWUwMWMzNzk1YzliYTk2OGE5ODgwMDFiMTdjMzE2MDkwIn0.eyJhdWQiOiIxIiwianRpIjoiNTE5YWExMzIyYTc1Yzg3MmZkNTgzOTc1NDMzOGVmOGY2Yjc4NmUxNTE5YTU3MTY5ZTAxYzM3OTVjOWJhOTY4YTk4ODAwMWIxN2MzMTYwOTAiLCJpYXQiOjE3MjA3MDc1ODgsIm5iZiI6MTcyMDcwNzU4OCwiZXhwIjoxNzUyMjQzNTg4LCJzdWIiOiIzMjEiLCJzY29wZXMiOltdfQ.lll58tWiK_GuSV_MBmoyuGiZAjI-CtHiVkyOzeQUNCRtcjn2AvYTyjbXvDPSSsvIJN7ZDo7Am6hbDQTdeEkQ-ST90ZYOsDX-5Cvj_IvpHEAWFo_K5uhHvfc0zZQZYi4nQ-CdadJWz7JE59rAjMCUZzaExeT2WaLRtY0k2Vjd6r43NbSdc9vct6cSqrp3-7jywDWkTRkrejGkF4y6kUcPO1cHkDteODsHmAyFWJj5jHZSfZSjm094JH4J9_9TmFb0PKPFW_9sUuP3BIyqtB57OFChIffGJhGz32q8MddwijfQexAWHifR9uk3cbdWDCJ35T23LDQy2jqOE9DkrU0CTikLCeL6zVLx_AtDIIQBJ-sX1vKNkFEJjRYi2w5Vvk59LUmDa_EYtq4CSwLKJmgpdaNUA-YhezMV4XYdcZ6HUAK6e_qdqyvdqTwYqUQgsfByZ-xZVXWQN3M0pbewVflQZ6MD9alsM612_EFUrGuvmTq9zkUpkH7y4wNxTga8p8Aarnchj9lJkp1_J3VauZ7ud9znGxSmslZPT2BivQFtAuE5_bIxhYCgAjD2Oum7PO8PjeNgHH2-VkYoxw_w_FFDr9CH0gkWV4oZusoTP8POM2_-NtYLWYxKzEy1tPf6RB6_ZxuLVvYeQEnP-8nRGnIIgCASjDzwxZCSoHBGKPdV_Wg',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                 "facility_id": 13,           
                 "facility_status": "inactive"
            }),
            success: function (data) {
                console.log(data);
                alert('Status updated successfully');
                $('#active_not').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            },
            error: function (err) {
               // console.log(err);
                alert('Failed to update status');
                console.error(err);
            }
        });
    });

    function populateEditModal(facility) {
        $('#start-date').val(facility.start_date);
        $('#end-date').val(facility.end_date);
        $('#reason').val(facility.reason);
    }

    function populateActiveModal(facility) {
        $('#court-name').text(facility.facility_name);
        $('#active-start-date').text(facility.start_date);
        $('#active-end-date').text(facility.end_date);
        $('#active-reason').text(facility.reason);
    }

    function populateViewModal(facility) {
        $('#view-court-name').text(facility.facility_name);
        $('#view-start-date').text(facility.start_date);
        $('#view-end-date').text(facility.end_date);
        $('#view-reason').text(facility.reason);
    }

    // Function to add new sports
    $('#save-sport').on('click', function () {
        let sportName = $('#new_sports input').val();
        if (!sportName) {
            alert('Please enter the sport name.');
            return;
        }

        const requestData = {
            "venue_id": null,
            "core_org_id": "3",
            "venue_latitude": "11.118.787.89",
            "venue_longitude": "11.118.787.90",
            "venue_name": sportName,
            "venue_address": "Elite",
            "venue_office_time": "6 am to 6 pm",
            "venue_contact_no": "1234567890",
            "venue_landmark": "Elite",
            "venue_city": "Elite",
            "venue_status": "active",
            "venue_location": "Elite"
        };

        console.log('Request Data:', requestData);

        $.ajax({
            url: 'https://booking.hwzthat.com/api/add_venue',
            type: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(requestData),
            success: function (data) {
                console.log(requestData, 'test');
                alert('New sport added successfully.');
                $('#new_sports').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                fetchVenues();
            },
            error: function (err) {
                alert('Failed to add new sport.');
                console.error(err);
            }
        });
    });
// function to add / update price for slot
$('#save-price').on('click', function () {
    let slotDefaultPrice = $('#price-input').val();
    let facilityId = currentFacility.facility_id;
    let venueId = currentFacility.venue_id;
    let bookingDate = new Date().toISOString().split('T')[0]; 

    // Fetch available slots for the day
    $.ajax({
        url: 'https://booking.hwzthat.com/api/get_available_slots',
        type: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            "facility_id": "",
            "booking_date": bookingDate
        }),
        success: function (data) {
            console.log(`Available slots for facility ${facilityId} on ${bookingDate}:`, data);
            if (data.status === 'Success') {
                let slots = data.result;

                // Iterate through each slot and call the add_slot API
                slots.forEach(slot => {
                    let requestData = {
                        "slot_title": slot.slot_title,
                        "slot_id": null, // Assuming it's for adding a new slot
                        "venue_id": venueId,
                        "facility_id": facilityId,
                        "slot_type_id": "1",
                        "slot_default_price": slotDefaultPrice,
                        "slot_start_time": slot.slot_start_time,
                        "slot_end_time": slot.slot_end_time,
                        "slot_status": "active"
                    };

                    console.log('Request Data:', requestData);

                    $.ajax({
                        url: 'https://booking.hwzthat.com/api/add_slot',
                        type: 'POST',
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify(requestData),
                        success: function (response) {
                            console.log('Slot added:', response);
                            $('#new_details').modal('hide');
                            $('body').removeClass('modal-open');
                            $('.modal-backdrop').remove();
                            if (response.status !== 'Success') {
                                alert(`Failed to add slot: ${response.errormessage || 'Unknown error occurred'}`);
                            }
                            $('#new_details').modal('hide');
                            $('body').removeClass('modal-open');
                            $('.modal-backdrop').remove();
                        },
                        error: function (err) {
                            console.error('Failed to add slot:', err);
                            //alert('Failed to add slot');
                        }
                    });
                });

                alert('Price updated successfully');
                $('#new_details').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            } else {
                console.error(`Failed to fetch available slots:`, data.errormessage);
                alert(`Failed to fetch available slots: ${data.errormessage}`);
            }
        },
        error: function (err) {
            console.error(`Error fetching available slots:`, err);
            alert('Error fetching available slots');
        }
    });
});

    // Function to add new court
    $('#save-court').on('click', function () {
        let courtName = $('#new_court input').val();
        let selectedSport = $('#new_court select').val();

        if (!courtName || !selectedSport) {
            alert('Please enter the court name and select a sport.');
            return;
        }

        let venueId = selectedSport === 'table tennis' ? 2 : 1;

        const requestData = {
            "Facility_id": null,
            "facility_name": courtName,
            "venue_id": venueId,
            "core_org_id": "3",
            "category_id": "1",
            "sub_category_id": "1",
            "facility_status": "active"
        };

        console.log('Request Data:', requestData);

        $.ajax({
            url: 'https://booking.hwzthat.com/api/add_facility',
            type: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(requestData),
            success: function (data) {
                console.log(data);
                alert('New court added successfully.');
                $('#new_court').modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                fetchVenues();
            },
            error: function (err) {
                alert('Failed to add new court.');
                console.error(err);
            }
        });
    });
});
