var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "304_207370166",
  database: "usersdata"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "CREATE TABLE member (memberID int AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), nickname VARCHAR(255), email VARCHAR(255), password VARCHAR(255), regDate DATE, updDate DATE, photo VARCHAR(2047))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
});