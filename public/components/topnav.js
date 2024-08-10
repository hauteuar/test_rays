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
        <a class="navbar-brand brand-logo" href="#"><img src="images/logo.png" class="mr-2" alt="logo"/></a>
      </div>
      <div class="navbar-menu-wrapper d-flex align-items-center justify-content-end">
        
        <ul class="navbar-nav mr-lg-2">
          <li class="nav-item nav-search d-none d-lg-block" style="margin:0;color: #428737;font-style: italic;font-size: 14px;">
           
          </li>
        </ul>
        <ul class="navbar-nav navbar-nav-right">
          <li class="nav-item ">
            <a class="position-relative p-0" >
              <img src="images/message.png" class="icon5">
              <span style="background-color: #FF862F;width:8px;height:8px;position: absolute;top: 5px;right: -5px;border-radius: 50%;"></span>
              <!-- <span style="color: #000;margin-left: 5px;font-size: 14px;">Messages</span> -->
            </a>
          </li>
          <li class="nav-item nav-logout dropdown">
            <a class="" href="#" data-toggle="dropdown" id="profileDropdown">
              <img src="images/logout.png" class="icon5 p-0" alt="profile"/>
            </a>
            <div class="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="profileDropdown">
             
              <a class="dropdown-item">
                <i class="ti-power-off text-primary"></i>
                Logout
              </a>
            </div>
          </li>
        </ul>
      </div>
    </nav>

     
    `;
  }
}

customElements.define('topnav-component', topnav);