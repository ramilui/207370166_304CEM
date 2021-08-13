// npm
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
var app = express();
var nodeoutlook = require('nodejs-nodemailer-outlook');
var newsRouter = require('./src/routes/news');
var connection = require('./src/connection');




// ejs
app.set('views', './src/views');
app.set('view engine', 'ejs');



// session
app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true,
}));


// path
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use('/login/src',express.static(__dirname +'/login/src'));
app.use(express.static('public'));
app.use('/home', newsRouter);



// re-link
function handleDisconnect() {
    connection.connect(function(err) {
        // callback(err,result);
        if (err) {
            console.log(err);
            console.log("try to connect");
            setTimeout(handleDisconnect, 1000);
            return;
        }
        console.log("Connected to the Database");
    });
}
handleDisconnect();



// url
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/form.html'));
});
app.get('/fail_login', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/fail_login.html'));
});
app.get('/fail_passwords', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/fail_passwords.html'));
});
app.get('/fail_exist', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/fail_exist.html'));
});
app.get('/forgot', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/form_forgot.html'));
});
app.get('/forgot_fail', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/form_forgot_fail.html'));
});
app.get('/sent', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/sent.html'));
});
app.get('/accc', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/accountCreated.html'));
});
app.get('/loggedOut', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/logout.html'));
});
app.get('/changePW_errA', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/changePassword_ErrA.html'));
});
app.get('/changePW_errB', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/changePassword_ErrB.html'));
});
app.get('/changePW', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/changePassword.html'));
});
app.get('/deleteAC', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/deleteAccount.html'));
});
app.get('/changed', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/changed.html'));
});
app.get('/deleteAC_err', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/deleteAccount_err.html'));
});
app.get('/deleted', function(request, response) {
	response.sendFile(path.join(__dirname + '/login/deleted.html'));
});



// get the date
let ts = Date.now();
var day = ts;
var week = ts - 604800000;
var month = ts - 2629746000;

let dateDay = new Date(day);
let dateWeek = new Date(week);
let dateMonth = new Date(month);

let dateDayDD = dateDay.getDate();
let dateDayMM = dateDay.getMonth() + 1;
let dateDayYYYY = dateDay.getFullYear();

let dateWeekDD = dateWeek.getDate();
let dateWeekMM = dateWeek.getMonth() + 1;
let dateWeekYYYY = dateWeek.getFullYear();

let dateMonthDD = dateMonth.getDate();
let dateMonthMM = dateMonth.getMonth() + 1;
let dateMonthYYYY = dateMonth.getFullYear();

var Today = (dateDayYYYY + "-" + dateDayMM + "-" + dateDayDD);


// login
app.post('/login', function(request, response) {
	var username = request.body.username_login;
	var password = request.body.password_login;
	console.log("received username:"+username+" &&&&&& recieved password: "+password)//console.log
	if (username && password) {
		connection.query('SELECT * FROM member WHERE username = ? AND password = ?', [username, password], function(error, resultsA, fields) {
			if (resultsA != 0) {
			console.log("Corresponing received username:"+username+" and recieved password: "+password+" are found")//console.log
			connection.query('SELECT nickname FROM member WHERE username = ?', [username], function(err, nicknameGet, fields) {
				if (err) {
				callback(err, null);
				} else {
				var nickname = nicknameGet[0].nickname;
				request.session.loggedin = true;
				request.session.username = username;
				request.session.nickname = nickname;
				response.redirect('/home');
				console.log(nickname+' logined');//console.log
				}
			})
			} else {
			connection.query('SELECT * FROM member WHERE email = ? AND password = ?', [username, password], function(error, resultsB, fields) {
				if (resultsB != 0) {
				var email = username;
				connection.query('SELECT nickname FROM member WHERE email = ?', [email], function(err, nicknameGet, fields) {
					if (err) {
					callback(err, null);
					} else {
					console.log('user logined with email address:'+email);//console.log
					connection.query('SELECT username FROM member WHERE email = ?', [email], function(err, usernameGet, fields) {
						if (err) {
						callback(err, null);
						} else {
						var nickname = nicknameGet[0].nickname;
						var username = usernameGet[0].username
						request.session.loggedin = true;
						request.session.username = username;
						request.session.nickname = nickname;
						response.redirect('/home');
						console.log(nickname+'logined');//console.log
						console.log(request.session.nickname);//console.log
						}
					});
					};
				}) 
				}else {
				response.redirect('/fail_login');
				console.log('username/password is invalid');//console.log
			
				}
			});
			}
		});
	} else {
	response.redirect('/');
	console.log('username/password is not defined');//console.log
	}
});


//log out
app.get('/logout', function(request, response) {
	console.log(request.session.nickname+' is loginng out');//console.log
	request.session.username = null;
	request.session.nickname = null;
	request.session.loggedin = false;
    console.log('All login information is cleared');//console.log
    response.redirect('/loggedOut');
});




// registration
app.post('/regist', function(request, response) {
	if (request.body.password_reg == request.body.cpassword_reg) {
		console.log('Registation request is received');//console.log
		console.log('Username :  '+request.body.username_reg);//console.log
		console.log('Email :  '+request.body.email_reg);//console.log
		console.log('Nickname :  '+request.body.nickname_reg);//console.log
		if (request.body.username_reg && request.body.email_reg) {
		connection.query('SELECT * FROM member WHERE username = ? OR email = ? ', [request.body.username_reg, request.body.email_reg], function(error, results, fields) {
			if (results.length > 0) {
				response.redirect('/fail_exist');
				response.end();
				console.log('Users infromation already exist');  //console.log
			} // already exist
			else if (request.body.password_reg == request.body.cpassword_reg){
				var username = request.body.username_reg;
				var nickname = request.body.nickname_reg;
				var password = request.body.password_reg;
				var email = request.body.email_reg;
				connection.connect(function(err) {
					if (err) throw err;
					connection.query("INSERT INTO member (username, nickname, email, password, regDate) values (?,?,?,?,?)", [username,nickname, email, password, Today],function (err, result, fields) {
					if (err) throw err;
					console.log('Added to the data base');//console.log
					console.log(result);//console.log
					});
					if (err) throw err;
					connection.query("CREATE TABLE ?? (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(2047), url VARCHAR(2047), comment VARCHAR(2047))", [username],function (err, result, fields) {
					if (err) throw err;
					console.log('Created individual table for the favorite list');//console.log
					console.log(result);//console.log
					});
				});
				response.redirect('/accc');
				console.log('account' + username + 'is successfully created');//console.log
				// clear session
				request.session.nickname = null;
				request.session.username = null;
				request.session.email = null;
				request.session.loggedin = null;
				console.log('Registation information is removed');//console.log-------------------------------
			}	// account created	// table created
			response.end();
		});
		}
		
	} else {
		response.redirect('/fail_passwords');
		response.end();
		console.log('Two passwords do not match');//console.log
	} // two password do not match
		
});


// forgot password
app.post('/forgotPW', function(request, response) {
	var username = request.body.username_forgot;
	var email = request.body.email_forgot;
	console.log('Password gaining is requested');//console.log
	if (username && email) {
	connection.query('SELECT * FROM member WHERE username = ? AND email = ?', [username, email], function(error, results, fields) {
			
		if (results != 0) {
		request.session.loggedin = true;
		request.session.username = username;
				
		connection.query('SELECT password FROM member WHERE username = ?', [username], function(err, passwordGet, fields) {
			
			if (err) {
			callback(err, null);
			
			} else {
									
			var PW = passwordGet[0].password;

			// Email				
			nodeoutlook.sendEmail({
									auth: {
										user: "coventry207370166@outlook.com",
										pass: "304_207370166"
									},
									
									from: 'coventry207370166@outlook.com',
									to: email,

									subject: 'Your Password',
									text: 'Your password is ' + PW + '.',

									onError: (e) => console.log(e),
									onSuccess: (i) => console.log(i)
								});
									console.log('Password gained : ' + PW);
			}
		});
		response.redirect('/sent');
		console.log('Email sent'); //success

		} else {
		response.redirect('/forgot_fail'); 
		console.log('The input infromation is not correct'); // wrong input
		}
		
	});
	
	}
});

// change password
app.post('/changePassword', function(request, response) {
	var username_changePW = request.body.username;
	var password_current = request.body.currentPassword;
	var password_new = request.body.password_change;
	var password_confirm = request.body.cpassword_change;
	console.log('Change password requested')//console.log
	console.log('username: '+username_changePW);//console.log
	console.log('current password:  '+password_current);//console.log
	console.log('new password:  '+password_new);//console.log
	if (username_changePW && password_current && password_new && password_confirm ) {
		if (password_new !== password_confirm){
		response.redirect('/changePW_errA');
		console.log('2 passwords are not matched');//console.log
		} else {
		connection.query('SELECT * FROM member WHERE username = ? AND password = ?', [username_changePW, password_current], function(error, resultsC, fields){
			if (resultsC != 0) {
				connection.query('UPDATE member SET password = ?, updDate = ?  WHERE username =?', [password_new, Today ,username_changePW], function(error, results, fields){
					if (error) throw err;
					console.log(username_changePW +' s password is updated');//console.log
					response.redirect('/changed')
					console.log("redirected to login page")
					username_changePW = null;
					password_current = null;
					password_new = null;
					password_confirm = null
					// clear session
					request.session.nickname = null;
					request.session.username = null;
					request.session.email = null;
					request.session.loggedin = null;
				})
			} else {
			response.redirect('/changePW_errB');
			console.log("username/password is invalid")
			username_changePW = null;
			password_current = null;
			password_new = null;
			password_confirm = null
			// clear session
			}
		});
		}

	} else {
	response.redirect('/changePW');
	console.log('username/password is not defined');
	username_changePW = null;
	password_current = null;
	password_new = null;
	password_confirm = null
	// clear session
	}
});

// delete account
app.post('/DeleteAC', function(request, response) {
	var username_DEL = request.body.username;
	var password_DEL = request.body.password;
	var confirm_DEL= request.body.confirm;
	console.log(username_DEL , password_DEL , confirm_DEL);//console.log
	if (username_DEL && password_DEL && confirm_DEL) {
		if (confirm_DEL !== 'DELETE'){
		response.redirect('/deleteAC_err');
		} else {
		connection.query('SELECT * FROM member WHERE username = ? AND password = ?', [username_DEL, password_DEL], function(error, resultsD, fields) {// Auth
				if (resultsD != 0) {
				connection.query('DELETE FROM member WHERE username = ?',[username_DEL], function(error, resultsE, fields){// Del Account
					if (error) throw error;
					console.log(username_DEL+' s account has been deleted');//console.log
						connection.query('DROP TABLE ??', [username_DEL], function(error, resultsE, fields){// Del table
							if (error) throw error;
							response.redirect('/deleted');
							console.log(username_DEL+' s favorite list has been deleted');//console.log
							
								// clear session
								username_DEL = null;
								password_DEL = null;
								confirm_DEL= null;
								request.session.nickname = null;
								request.session.username = null;
								request.session.email = null;
								request.session.loggedin = null;
						});
				});
			 	} else {
				response.redirect('/deleteAC_err');
				};
		});
		};
	};
});








app.listen(3000);
console.log("Today is "+Today);//console.log
console.log('Connected on port:3000');//console.log