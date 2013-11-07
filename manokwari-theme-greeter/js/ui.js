$(document).ready(buildUI);

var ui_center = 0;
var user_padding = 30;
var user_selected_width = 150;
var user_selected_height = 150;
var user_width = 85;
var user_height = 85;
var selected_user = 0;
var user_top_displacement = 60;
var user_image_size = 85;
var user_selected_image_size = 150;
var animation_time = 1000;
var last_pw = '';
var password_field_active = false;
var noimage = '';

function buildUI() {
	//Center the wrapper
	centerit();
	$(window).resize(centerit);
	
	// Build Shutdown Menu
	var shutdownmenu = '';
	if(lightdm.can_suspend)
		shutdownmenu += '<li><a href="#" onclick="lightdm.suspend()">Suspend</a></li>';
	if(lightdm.can_hibernate)
		shutdownmenu += '<li><a href="#" onclick="lightdm.hibernate()">Hibernate</a></li>';
	if(lightdm.can_restart)
		shutdownmenu += '<li><a href="#" onclick="lightdm.restart()">Restart</a></li>';
	if(lightdm.can_shutdown)
		shutdownmenu += '<li><a href="#" onclick="lightdm.shutdown()">Shutdown</a></li>';
	shutdownmenu += '<div class="down-arrow-bottom"></div>';
	$('#shutdown-menu').html(shutdownmenu);
	$('#shutdown-container').click(function() {
		$('#session-menu').hide();
		$('#shutdown-menu').toggle();
	});
	
	// Build session chooser
	var sessionmenu = '';
	for(var i in lightdm.sessions)
	{
		var session = lightdm.sessions[i];
		sessionmenu += '<li id="session-'+session.key+'">';
		sessionmenu += '<a href="#" onclick="select_session(\''+session.key+'\');"';
		sessionmenu += 'title="'+session.comment+'">'+session.name+'</a></li>';
	}
	sessionmenu += '<div class="down-arrow-bottom"></div>';
	$('#session-menu').html(sessionmenu);
	$('#session-container').click(function() {
		$('#shutdown-menu').hide();
		$('#session-menu').toggle();
	});
	
	// Build User List
	$.each(lightdm.users, function(index, value) { 
		if (value.image.length > 0) {
			image = '<img class="userimage" src="'+value.image+'"></img>';
			noimage = '';
		}
		else {
			image = '';
			noimage = ' no-image';
		}
		var user_html = '<div id="user-'+value.name+'" class="user'+noimage+'">';
		// Invisible Data containers
		// escape
		$("#temp").text(value.display_name);
		var displayname = $("#temp").html();
		$("#temp").empty();
		user_html += '<div class="user-id-value">'+index+'</div>';
		user_html += '<div class="user-name-value">'+value.name+'</div>';
		user_html += '<div class="user-displayname-value">'+displayname+'</div>';
		if(value.session) {
			user_html += '<div class="user-session-value">'+value.session+'</div>';
		} else {
			user_html += '<div class="user-session-value">'+lightdm.default_session+'</div>';
		}
		if(value.logged_in)
			user_html += '<div class="logged-in"></div>';
		var firstname = displayname.split(" ");
		user_html += '<div class="userimgcont"><div class="imgoverlay"></div>'+image+'</div>';
		user_html += '<div class="user-name-container'+noimage+'"><div>'+firstname[0]+'</div></div>';
		user_html += '</div>';
		$('#users').append(user_html);
	});
	
	// Setup User Click events
	$('#users > .user').click(function(){
		$('.user-selected').removeClass('user-selected');
		$(this).addClass('user-selected');
		removelighdmalert();
		lightdm.start_authentication($('.user-name-value', this).html());
		$('#password-input').blur();
		position_users();
	});
	
	// Initialize Bigtext to resize Username if too long
	$('div.user-name-container').each(function() {
		$(this).bigtext({maxfontsize: 30, minfontsize: 13}); //FIXME
	});
	
	// Switch User to default User
	if(lightdm.timed_login_user){
		switch_user($('#user-'+lightdm.timed_login_user+' .user-id-value').html());
	} else {
		switch_user(selected_user);
	}
	
	// Setup Key Press Events
	$(window).keydown(function(event) {
		if(password_field_active) {
			// Enter Key inside Password Box
			if(event.keyCode == 13) {
				password_submit();
			}
		} else {
			switch(event.keyCode) {
				// left in testing mode, weird??
				case 0:
					switch_user(selected_user + 1);
					removelighdmalert();
					break;
				// proper left key
				case 39:
					switch_user(selected_user + 1);
					removelighdmalert();
					break;
				// right in testing mode, weird??
				case 18:
					switch_user(selected_user - 1);
					removelighdmalert();
					break;
				// proper right key
				case 37:
					switch_user(selected_user - 1);
					removelighdmalert();
					break;
				default:
					//alert(event.keyCode); // DEBUG FUNCTION
					// Focus the Password input
					$('#password-input').focus();
					break;
			}
		}
	});
	
	// Mouse wheel interaction
	$('body').wheel(function(event,delta){
		if(delta>0) {
			switch_user(selected_user -1);
			removelighdmalert();
		}
		else {
			switch_user(selected_user +1);
			removelighdmalert();
		}
	});
	
	// Setup the password box events
	$('#password-input').focus(function(event){
		password_field_active = true;
	});
	$('#password-input').blur(function(event){
		if($(this).val() != "")
			last_pw = $(this).val();
		$(this).val("");
		password_field_active = false;
	});
	$('#login-button').click(password_submit);
}

function select_session(session) {
	$('li.session-selected').removeClass('session-selected');
	$('.user-selected .user-session-value').html(session);
	$('li#session-'+session).addClass('session-selected');
}

function show_prompt(text) {
	$('#message').html(text);
}

function show_message(text) {
	$('#message').html(text);
}

function show_error(text) {
	$('#message').html(text);
}

function switch_user(user_index) {
	$('.user').each(function(index) {
		if(index == user_index) {
			$('.user-selected').removeClass('user-selected');
			$(this).addClass('user-selected');
			lightdm.start_authentication($('.user-name-value', this).html());
			$('#password-input').blur();
		}
	});
	position_users();
}

function password_submit() {
	$('#password-input').blur();
	lightdm.provide_secret(last_pw);
}

function authentication_complete() {
	if(lightdm.is_authenticated) {
		var session = $('div.user-selected > div.user-session-value').html();
		
		if(session != "null" && session != null){
			lightdm.login(lightdm.authentication_user, session);
		} else {
			lightdm.login(lightdm.authentication_user);
		}
	} else {
		var displayname = $('div.user-selected > div.user-displayname-value').html();
		lightdmalert("<b>The password you entered for "+displayname+" was incorrect.</b><br>Make sure you've selected the correct user and try again.");
		switch_user(selected_user);
	}
}

function position_users() {
	//find the position of the selected and position it
	$('.user').each(function(index) {
		if($(this).hasClass('user-selected')) {
			$(this).css("left", ui_center + 'px');
			$(this).css("top", '0px');
			// Select the session in the session menu
			$('li.session-selected').removeClass('session-selected');
			var session = $('.user-session-value', this).html();
			$('li#session-'+session).addClass('session-selected');
			selected_user = index;
		}
	});
	$('.user').each(function(index) {
		if($(this).hasClass('user-selected') == false) {
			//Calculates User container position
			if(index < selected_user) {
				var ui_pos = ui_center - ((selected_user - index) * (user_width + user_padding));
				$(this).css("left", ui_pos + 'px');
				$(this).css("top", user_top_displacement + 'px');
			}
			if(index > selected_user) {
				var ui_pos = ui_center + user_selected_width + user_padding + ((index - selected_user -1) * (user_width + user_padding));
				$(this).css("left", ui_pos + 'px');
				$(this).css("top", user_top_displacement + 'px');
			}
		}
	});
	//Write this here to save me copying and pasting it for every event
	$('div.user-name-container').each(function() {
		$(this).bigtext({maxfontsize: 30, minfontsize: 13}); //FIXME
	});
}

function centerit() {
	ui_center = ($(document).width() - user_selected_width) / 2;
	position_users();
	//center users vertically
	var margin_top = ($(document).height() - 400) / 2;
	$('#center').css('top', margin_top + 'px');
	//center login bar horizontally
	var login_left = ($(document).width() - 250) / 2;
	$('#password-box').css('left', login_left + 'px');
	//$('#password-box').css('top', margin_top + 250 + 'px');
}

function lightdmalert(message) {
	removelighdmalert(true);
	$('#center').append('<div class="alert">'+message+'</div>');
}

function removelighdmalert(nofade) {
	if (nofade!=true) {
		$('.alert').fadeOut(300, function() { $(this).remove() ;} );
	}
	else {
		$('.alert').remove();
	}
}

