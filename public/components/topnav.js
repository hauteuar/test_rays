class topnav extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
    <nav class="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
      <div class="text-center navbar-brand-wrapper d-flex align-items-center pl-2">
        <button class="navbar-toggler navbar-toggler max-991 align-self-center" type="button" data-toggle="minimize">
          <img src="images/menu.png" class="mr-2 icon-menu" alt="menubar" style="width: 20px;" />
        </button>
        <button class="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas">
          <img src="images/menu.png" class="mr-2 icon-menu pt-3" alt="menubar" style="width: 20px;" />
        </button>
        <a class="navbar-brand brand-logo" href="#"><img id="org-logo" src="images/logo.png" class="mr-2" alt="logo"/></a>
      </div>
      <div class="navbar-menu-wrapper d-flex align-items-center justify-content-end">
        <ul class="navbar-nav mr-lg-2">
          <li class="nav-item nav-search d-none d-lg-block" style="margin:0;color: #428737;font-style: italic;font-size: 14px;"></li>
        </ul>
        <ul class="navbar-nav navbar-nav-right">
          <li class="nav-item">
            <a class="position-relative p-0" href="/checkout.html" id="cart-icon">
              <img src="images/cart.png" class="icon5">
              <span id="cart-count" style="background-color: #FF862F;width:16px;height:16px;position: absolute;top: 5px;right: -5px;border-radius: 50%;font-size: 10px;text-align: center;line-height: 16px;color: #fff; display: none;"></span>
            </a>
          </li>
          <li class="nav-item">
            <a class="position-relative p-0" href="/notification.html" id="mail-icon">
              <img src="images/message.png" class="icon5">
              <span id="mail-notification" style="background-color: transparent;width:8px;height:8px;position: absolute;top: 5px;right: -5px;border-radius: 50%;"></span>
            </a>
          </li>
          <li class="nav-item nav-logout dropdown">
            <a class="" href="#" data-toggle="dropdown" id="profileDropdown">
              <img src="images/logout.png" class="icon5 p-0" alt="profile"/>
            </a>
            <div class="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="profileDropdown" id="profileDropdownMenu">
              <a class="dropdown-item" href="#" id="logoutButton">
                <i class="ti-power-off text-primary"></i>
                Logout
              </a>
              <div id="orgSwitchContainer"></div>
            </div>
          </li>
        </ul>
      </div>
    </nav>
    `;

    this.fetchOrganizationLogo();
    this.updateCartIcon();
    this.updateMailIcon();
    this.checkOrganizations();

    document.getElementById('logoutButton').addEventListener('click', () => {
      this.logout();
    });
  }

  fetchOrganizationLogo() {
    const organizationId = localStorage.getItem('organizationId');
    fetch(`/api/organizations/${organizationId}/logo`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'organizationId': organizationId,
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.logo_url) {
        document.getElementById('org-logo').src = data.logo_url;
      }
    })
    .catch(error => console.error('Error fetching organization logo:', error));
  }

  async updateCartIcon() {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/cart/${userId}`);
  
      if (response.ok) {
        const cart = await response.json();
        const cartCount = cart.items.length;
        const cartCountElement = document.getElementById('cart-count');
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
      } else {
        console.error('Failed to load cart data');
      }
    } catch (error) {
      console.error('Error updating cart icon:', error);
    }
  }

  updateMailIcon() {
    const userId = localStorage.getItem('userId');
    fetch(`/api/user/notifications/unread-count/${userId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'organizationId': localStorage.getItem('organizationId')
        }
    })
    .then(response => response.json())
    .then(data => {
        const unreadCount = data.unreadCount || 0;
        const mailNotificationElement = document.getElementById('mail-notification');
        mailNotificationElement.style.backgroundColor = unreadCount > 0 ? '#FF862F' : 'transparent';
        mailNotificationElement.style.display = unreadCount > 0 ? 'block' : 'none';
    })
    .catch(error => console.error('Error fetching unread notifications:', error));
  }

  checkOrganizations() {
    fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.organizations && data.organizations.length > 1) {
        this.renderSwitchProfileOptions(data.organizations);
      }
    })
    .catch(error => console.error('Error fetching user organizations:', error));
  }

  renderSwitchProfileOptions(organizations) {
    const orgSwitchContainer = document.getElementById('orgSwitchContainer');
    orgSwitchContainer.innerHTML = `<div class="dropdown-divider"></div>`;
    organizations.forEach(org => {
      const orgSwitchItem = document.createElement('a');
      orgSwitchItem.classList.add('dropdown-item');
      orgSwitchItem.href = '#';
      orgSwitchItem.textContent = `Switch to ${org.org_name}`;
      orgSwitchItem.addEventListener('click', () => this.switchOrganization(org.org_id));
      orgSwitchContainer.appendChild(orgSwitchItem);
    });
  }

  switchOrganization(orgId) {
    localStorage.setItem('organizationId', orgId);
    window.location.reload();
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

customElements.define('topnav-component', topnav);
