var mysql = require('mysql2');
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '304_207370166',
	database : 'usersdata'
});

module.exports = connection;
