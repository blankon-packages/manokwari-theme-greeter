function LightDMUser (name, real_name, image, logged_in)
{
    this.name = name;
    this.real_name = real_name;
    this.display_name = real_name;
    this.image = image;
    this.logged_in = logged_in;
}

function LightDMSession (key, name, comment)
{
    this.key = key;
    this.name = name;
    this.comment = comment;
}

function _cancel_timed_login ()
{
    if (_login_timer != null)
    {
        clearTimeout (_login_timer);
        _login_timer = null;
    }
}

function _start_authentication (user)
{
    this._user = user;
    this.is_authenticated = false;
    show_prompt ("Password:");
}

function _provide_secret (secret)
{
    this.is_authenticated = (secret == "password");
    authentication_complete ();
}

function _cancel_authentication ()
{
    this.is_authenticated = false;
}

function _suspend ()
{
    window.location = 'http://people.ubuntu.com/~robert-ancell/lightdm/suspend.jpg';
}

function _hibernate ()
{
   alert ('Attempted to hibernate, but can_hibernate = false');
}

function _restart ()
{
    window.location = 'http://people.ubuntu.com/~robert-ancell/lightdm/restart.jpg';
}

function _shutdown ()
{
    window.location = 'http://people.ubuntu.com/~robert-ancell/lightdm/shutdown.jpg';
}

function _login ()
{
    if(this.is_authenticated)
	window.location = 'http://people.ubuntu.com/~robert-ancell/lightdm/' + this._user + '-desktop.jpg';
    else
        show_promt("Password wrong");
}

function LightDMClass ()
{
    this.users = [new LightDMUser("kholiq", "Kholiq", "./img/user.png", true),
				  new LightDMUser("bagio", "Bagio", "./img/user.png", true),
				  new LightDMUser("kirun", "Kirun", "./img/user.png", true),];
    this.num_users = this.users.length;
    this.sessions = [new LightDMSession("blankon", "BlankOn", "This session logs you into Manokwari"),
                     new LightDMSession("gnome", "Gnome", "This session logs you into Gnome"),
                     new LightDMSession("kde", "Kde", "This session logs you into Kde")];
    this.default_session = "blankon";
    this.timed_login_user = "bagio";
    this.timed_login_delay = 5;
    this.is_authenticated = false;
    this.can_suspend = true;
    this.can_hibernate = true;
    this.can_restart = true;
    this.can_shutdown = true;
    this.cancel_timed_login = _cancel_timed_login;
    this.start_authentication = _start_authentication;
    this.provide_secret = _provide_secret;
    this.cancel_authentication = _cancel_authentication;
    this.suspend = _suspend;
    this.hibernate = _hibernate;
    this.restart = _restart;
    this.shutdown = _shutdown;
    this.login = _login;
    
    this._user = this.timed_login_user;
}

if(typeof lightdm == 'undefined') {
	//alert("Lightdm not running!");
	lightdm = new LightDMClass();
}
