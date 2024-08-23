class Sidebar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.fetchUserProfile();
  }

  
  async fetchUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token not found');
        }

        const response = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 200) {
            console.log(data);
            localStorage.setItem('userId', data._id);

            // Store organization ID and name if available
            if (data.organizations && data.organizations.length > 0) {
                const organization = data.organizations[0];
                localStorage.setItem('organizationId', organization.org_id);
                localStorage.setItem('organizationName', organization.org_id);
                localStorage.setItem('role', data.role);
            }

            this.renderSidebar(data);
        } else {
            console.error('Failed to fetch user profile', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
async fetchOrganizationThemeColor(organizationId) {
  try {
      const response = await fetch(`/api/organizations/${organizationId}/theme`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      });

      const data = await response.json();

      if (response.status === 200 && data.theme_color) {
          // Apply the theme color to the sidebar
          this.applyThemeColor(data.theme_color);
      } else {
          console.error('Failed to fetch organization theme color', data.error);
      }
  } catch (error) {
      console.error('Error fetching organization theme color:', error);
  }
}

applyThemeColor(themeColor) {
  const sidebar = this.querySelector('.sidebar-offcanvas');
  if (sidebar) {
      sidebar.style.backgroundColor = themeColor;
  }
}

  renderSidebar(userProfile) {
    var page = this.getAttribute('data-page');
    const { firstName, lastName, role, photo } = userProfile;
    const userPhoto = photo ? photo : 'images/user4.png';
    const fullName = `${firstName} ${lastName}`;

    this.innerHTML = `
      <nav class="sidebar sidebar-offcanvas" id="sidebar">
        <ul class="nav">
          <li class="nav-item mb-4">
            <div class="text-center">
              <img src="${userPhoto}" class="image-edit-in-mini-sidebar" style="width:100px; height:100px; border-radius:50%; margin-top:20px;">
              <h4 class="hide-in-mini-sidebar text-white" style="font-size:16px;font-weight: 700;margin-bottom:6px">${fullName}</h4>
              <h4 class="hide-in-mini-sidebar" style="font-size:12px; color:#091763;">${role}</h4>
            </div>
          </li>
          <div class="nav-menus">
            ${this.getRoleSpecificMenu(role, page)}
          </div>
        </ul>
      </nav>
    `;

    const organizationId = localStorage.getItem('organizationId');
    if (organizationId) {
      this.fetchOrganizationThemeColor(organizationId);
    }
    this.applyCustomScrollbar();
  }

  applyCustomScrollbar() {
    const style = document.createElement('style');
    style.textContent = `
      .sidebar-offcanvas {
        scrollbar-width: thin;
        scrollbar-color: blue transparant;
      }
      .sidebar-offcanvas::-webkit-scrollbar {
        width: 8px;
      }
      .sidebar-offcanvas::-webkit-scrollbar-track {
        background: transparent;
      }
      .sidebar-offcanvas::-webkit-scrollbar-thumb {
        background-color: transparent;
        border-radius: 10px;
      }
    `;
    document.head.appendChild(style);
  }


  getRoleSpecificMenu(role, page) {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'org_admin':
        return `
          <a href="booking_management.html">
            <li class="nav-item ${page == 'calendar' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/calendar.png">
                <span class="menu-title">Calendar</span>
              </div>
            </li>
          </a>
          <a href="courses.html">
            <li class="nav-item ${page == 'courses' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/course.png">
                <span class="menu-title">Courses</span>
              </div>
            </li>
          </a>
          <a href="coaches.html">
            <li class="nav-item ${page == 'coaches' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/coach.png">
                <span class="menu-title">Coaches</span>
              </div>
            </li>
          </a>
          <a href="student_management.html">
            <li class="nav-item ${page == 'student_management' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/student.png">
                <span class="menu-title">Student Management</span>
              </div>
            </li>
          </a>
          <a href="notification.html">
            <li class="nav-item ${page == 'notifications' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/notifications.png">
                <span class="menu-title">Notifications</span>
              </div>
            </li>
          </a>
          <a href="billing.html">
            <li class="nav-item ${page == 'billing' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/billings.png">
                <span class="menu-title">Billing</span>
              </div>
            </li>
          </a>
          <a href="registration-form.html">
            <li class="nav-item ${page == 'registration-form' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/sheet.png">
                <span class="menu-title">Registration Form</span>
              </div>
            </li>
          </a>
          <a href="reports.html">
            <li class="nav-item ${page == 'report' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/Report.png">
                <span class="menu-title">Report</span>
              </div>
            </li>
          </a>
          <a href="club_document.html">
            <li class="nav-item ${page == 'club_document' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/document.png">
                <span class="menu-title">Club Document</span>
              </div>
            </li>
          </a>
          <a href="sponsors.html">
            <li class="nav-item ${page == 'advs_management' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/adv.png">
                <span class="menu-title">Advs Management</span>
              </div>
            </li>
          </a>
          <a href="e_com.html">
            <li class="nav-item ${page == 'e_com' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/Store.png">
                <span class="menu-title">E Com</span>
              </div>
            </li>
          </a>
          <a href="org_onboarding.html">
            <li class="nav-item ${page == 'org_onboard' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/management.png">
                <span class="menu-title">User Access Management</span>
              </div>
            </li>
          </a>
        `;
      case 'coach':
      case 'freelance_coach':
        return `
          <a href="assignmentview.html">
            <li class="nav-item ${page == 'assignments' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/assesments.png">
                <span class="menu-title">Assignments</span>
              </div>
            </li>
          </a>
          <a href="connect-live.html">
            <li class="nav-item ${page == 'connect-live' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/live-practice.png">
                <span class="menu-title">Connect Live</span>
              </div>
            </li>
          </a>
          <a href="chat.html">
            <li class="nav-item ${page == 'chat' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/chat1.png">
                <span class="menu-title">Live Chat</span>
              </div>
            </li>
          </a>
          <a href="my_team.html">
            <li class="nav-item ${page == 'my-team' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/my-team.png">
                <span class="menu-title">My Team</span>
              </div>
            </li>
          </a>
          <a href="courses.html">
            <li class="nav-item ${page == 'courses' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/course.png">
                <span class="menu-title">Courses</span>
              </div>
            </li>
          </a>
          <a href=" stats.html">
            <li class="nav-item ${page == 'stats' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/stats-match.png">
                <span class="menu-title">Player Stats</span>
              </div>
            </li>
          </a>
          <a href="fitness.html">
            <li class="nav-item ${page == 'fitness' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/fitness.png">
                <span class="menu-title">Fitness Testing</span>
              </div>
            </li>
          </a>
          <a href="coach-details.html">
            <li class="nav-item ${page == 'my_schedule' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/schedule.png">
                <span class="menu-title">My Schedule</span>
              </div>
            </li>
          </a>
          <a href="payments-student.html">
            <li class="nav-item ${page == 'payments' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/billings.png">
                <span class="menu-title">Payments</span>
              </div>
            </li>
          </a>
        `;
      case 'student':
        return `
          <a href="connect-live.html">
            <li class="nav-item ${page == 'connect-live' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/Meetings.png">
                <span class="menu-title">Connect Live</span>
              </div>  
            </li>
          </a>
          <a href="student_tasks.html">
            <li class="nav-item ${page == 'student_task' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/registration.png">
                <span class="menu-title">My Task</span>
              </div>
            </li>
          </a>
          <a href="uploads.html">
            <li class="nav-item ${page == 'uploads' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/upload.png">
                <span class="menu-title">Uploads</span>
              </div>
            </li>
          </a>
          <a href="student_course_list.html">
            <li class="nav-item ${page == 'courses' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/course.png">
                <span class="menu-title">Courses</span>
              </div>
            </li>
          </a>
          <a href="student-coach.html">
            <li class="nav-item ${page == 'coaches' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/coache.png">
                <span class="menu-title">Coaches</span>
              </div>
            </li>
          </a>
          <a href="chat.html">
            <li class="nav-item ${page == 'chat' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/Chat1.png">
                <span class="menu-title">Live Chat</span>
              </div>
            </li>
          </a>
          <a href="stats.html">
            <li class="nav-item ${page == 'stats' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/stats-match.png">
                <span class="menu-title">My Stats</span>
              </div>
            </li>
          </a>
          <a href="notification.html">
            <li class="nav-item ${page == 'notifications' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/notifications.png">
                <span class="menu-title">Notifications</span>
              </div>
            </li>
          </a>
          <a href="payments-student.html">
            <li class="nav-item ${page == 'payments' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/billings.png">
                <span class="menu-title">Payments</span>
              </div>
            </li>
          </a>
          
        `;
      case 'parent':
        return `
          <a href="dashboard.html">
            <li class="nav-item ${page == 'dashboard' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/dashboard.png">
                <span class="menu-title">Dashboard</span>
              </div>
            </li>
          </a>
          <a href="my_children.html">
            <li class="nav-item ${page == 'my_children' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/family.png">
                <span class="menu-title">My Children</span>
              </div>
            </li>
          </a>
          <a href="billing.html">
            <li class="nav-item ${page == 'billing' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/billings.png">
                <span class="menu-title">Billing</span>
              </div>
            </li>
          </a>
          <a href="logout.html">
            <li class="nav-item ${page == 'logout' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/logout.png">
                <span class="menu-title">Logout</span>
              </div>
            </li>
          </a>
        `;
      default:
        return `
          <a href="dashboard.html">
            <li class="nav-item ${page == 'dashboard' ? 'active' : ''}">
              <div class="nav-link">
                <img src="images/dashboard.png">
                <span class="menu-title">Welcome</span>
              </div>
            </li>
          </a>
        `;
    }
  }
}

customElements.define('sidebar-component', Sidebar);
