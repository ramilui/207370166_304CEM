const express = require('express');
const newsRouter = express.Router();
const axios = require('axios');
var session = require('express-session');
var connection = require('../connection');





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

var oneDay =("&from="+ dateDayYYYY + "-" + dateDayMM + "-" + dateDayDD);
var oneWeek = ("&from="+ dateWeekYYYY + "-" + dateWeekMM + "-" + dateWeekDD);
var oneMonth = ("&from="+ dateMonthYYYY + "-" + dateMonthMM + "-" + dateMonthDD);



// session
newsRouter.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true,
		cookie: {
        path    : '/',
		  httpOnly: false,
		  maxAge  : 24*60*60*1000
		},
}));




// home
newsRouter.get('', async(request, response) => {
    

    if (request.session.loggedin) { 
        console.log(request.session.nickname+' is on the homepage');
    try {
        const newsAPI = await axios.get(`https://newsapi.org/v2/top-headlines?country=hk&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);//Newsapi
        const weather = await axios.get(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd`);//HkO API nine days
        const weatherNow = await axios.get(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=flw`);//HkO API today

        response.render('news', { articles : newsAPI.data.articles, weather : weather.data.weatherForecast, weatherNow : weatherNow.data});
    } catch (err) {
        if(err.response) {
            console.log(err.response.data);
            console.log(err.response.status);
            console.log(err.response.headers);
            response.render('news', { articles : null });
        } else if(err.requiest) {
            response.render('news', { articles : null });
            console.log(err.requiest);
        } else {
            response.render('news', { articles : null });
            console.error('Error', err.message);
        }
    } 

    } else {
    response.redirect('/');
    }
})



// weather
newsRouter.get('/weather', async(request, response) => {
    

    if (request.session.loggedin) { 
        console.log(request.session.nickname+' is on the weather page');
    try {
        const weather = await axios.get(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd`);//nine days
        const weatherNow = await axios.get(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=flw`);//today

        response.render('newsWeather', {weather : weather.data.weatherForecast, weatherNow : weatherNow.data});
    } catch (err) {
        if(err.response) {
            console.log(err.response.data);

            response.render('newsWeather', { weather : null , weatherNow : null });
        } else if(err.requiest) {
            response.render('newsWeather', {  weather : null , weatherNow : null });
            console.log(err.requiest);
        } else {
            response.render('newsWeather', {  weather : null , weatherNow : null });
            console.error('Error', err.message);
        }
    } 

    } else {
    response.redirect('/');
    }
})


// toSingle
newsRouter.post('/Single', function(request, response){
    
    var image = request.body.image;
	var publish = request.body.publish;
    var title = request.body.title;
    var source = request.body.source;
    var author = request.body.author;
    var description = request.body.description;
    var url = request.body.url;
    console.log(image);
    console.log(publish);
    console.log(title);
    console.log(source);
    console.log(author);
    console.log(description);
    response.render('newsSingle', {image, publish, title, source, author, description, url});
})

// toAchieve
newsRouter.post('/archive', function(request, response){
    var username = request.session.username;
    var title = request.body.title;
    var url = request.body.url;
    connection.query('SELECT * FROM ?? WHERE title = ?', [username, title], function(error, results, fields) {
        if (results != 0) {
        response.status(204).send();
        console.log('Archive infromation already exist');  // already exist
        } else {
        connection.query("INSERT INTO ?? (title, url, comment) values (?,?,?)", [username, title, url, "No comment"], function (err, result, fields) {
            if (err) throw err;
            console.log('archived');
            //check the favorite list
            connection.query("SELECT title, url, comment FROM ??", [username], function (err, result, fields) {
                if (err) throw err;
                console.log(result);
            });
            response.status(204).send();
        });
        };
    });
});


// yourWords
newsRouter.post('/yourWords', function(request, response){
    var username = request.session.username;
    var title = request.body.words;
 
    connection.query("INSERT INTO ?? (title, comment) values (?,?)", [username, title, "No comment"], function (err, result, fields) {
        if (err) throw err;
        console.log('archived');
        //check the words
        connection.query("SELECT title FROM ??", [username], function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            response.redirect('/home/archive');
        });
    });
});

// update the comment
newsRouter.post('/updateComment', function(request, response){
    var username = request.session.username;
    var title = request.body.title;
    var newComment = request.body.newComment;
    connection.query('UPDATE ?? SET comment = ?  WHERE title =?', [username, newComment ,title], function(error, results, fields){
        if (error) throw err;
        console.log('The comment is updated');  //Updated
        response.redirect('/home/archive');
        });
});

// Delete post
newsRouter.post('/deletePost', function(request, response){
    var username = request.session.username;
    var title = request.body.title;
	connection.query('DELETE FROM ?? WHERE title = ?',[username, title], function(error, resultsE, fields){// Del Account
        if (error) throw error;
        console.log('The news is deleted');
        response.redirect('/home/archive');
        });
});


//archive
newsRouter.get('/archive', async(request, response) => {

    if (request.session.loggedin) { 
        console.log(request.session.nickname+' is on the archive page');
    try {
        var username = request.session.username;
        var nickname = request.session.nickname;
        connection.query("SELECT title, url, comment FROM ??", [username], function (err, result, fields) {
        if (err) throw err;
        response.render('newsArchive', { result, nickname } );
        });
    } catch (err) {
        if(err.response) {
            console.log(err.response.data);
            console.log(err.response.status);
            console.log(err.response.headers);
            response.render('news', { articles : null });
        } else if(err.requiest) {
            response.render('news', { articles : null });
            console.log(err.requiest);
        } else {
            response.render('news', { articles : null });
            console.error('Error', err.message);
        }
    } 

    } else {
    response.redirect('/');
    }
})



// search result
newsRouter.post('', async(request, response) => {
    if (request.session.loggedin) { 
        console.log(request.session.nickname+' is on the search page');
    if (request.body.Date == 0) {
    try {
        var search = encodeURI(request.body.search);
        var sort = request.body.sort;
        console.log(sort);
        var language = request.body.language;
        console.log(language);
        var date = '';
        console.log(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
        var newsAPI = await axios.get(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
        response.render('newsSearch', { articles : newsAPI.data.articles });

    } catch (err) {
        if(err.response) {
            response.render('newsSearch', { articles : null });
            console.log(err.response.data);
            console.log(err.response.status);
            console.log(err.response.headers);
        } else if(err.requiest) {
            response.render('newsSearch', { articles : null });
            console.log(err.requiest);
        } else {
            response.render('newsSearch', { articles : null });
            console.error('Error', err.message);
        }
    } 
    

// today
    } else if (request.body.Date == 1) {
        try {
            var search = encodeURI(request.body.search);
            var sort = request.body.sort;
            console.log(sort);
            var language = request.body.language;
            console.log(language);
            var date = oneDay;
            console.log(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
            var newsAPI = await axios.get(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
            response.render('newsSearch', { articles : newsAPI.data.articles });
    
        } catch (err) {
            if(err.response) {
                response.render('newsSearch', { articles : null });
                console.log(err.response.data);
                console.log(err.response.status);
                console.log(err.response.headers);
            } else if(err.requiest) {
                response.render('newsSearch', { articles : null });
                console.log(err.requiest);
            } else {
                response.render('newsSearch', { articles : null });
                console.error('Error', err.message);
            }
        } 
// one week
    } else if (request.body.Date == 2){
        try {
            var search = encodeURI(request.body.search);
            var sort = request.body.sort;
            console.log(sort);
            var language = request.body.language;
            console.log(language);
            var date = oneWeek;
            console.log(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
            var newsAPI = await axios.get(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
            response.render('newsSearch', { articles : newsAPI.data.articles })
    
        } catch (err) {
            if(err.response) {
                response.render('newsSearch', { articles : null });
                console.log(err.response.data);
                console.log(err.response.status);
                console.log(err.response.headers);
            } else if(err.requiest) {
                response.render('newsSearch', { articles : null });
                console.log(err.requiest);
            } else {
                response.render('newsSearch', { articles : null });
                console.error('Error', err.message);
            }
        } 
// one month
    } else if (request.body.Date == 3){
        try {
            var search = encodeURI(request.body.search);
            var sort = request.body.sort;
            console.log(sort);
            var language = request.body.language;
            console.log(language);
            var date = oneMonth;
            console.log(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
            var newsAPI = await axios.get(`https://newsapi.org/v2/everything?q=${search}${sort}${language}${date}&apiKey=0ffe7c1b28b74cbe89ac731471f50885`);
            response.render('newsSearch', { articles : newsAPI.data.articles });
    
        } catch (err) {
            if(err.response) {
                response.render('newsSearch', { articles : null });
                console.log(err.response.data);
                console.log(err.response.status);
                console.log(err.response.headers);
            } else if(err.requiest) {
                res.render('newsSearch', { articles : null });
                console.log(err.requiest);
            } else {
                res.render('newsSearch', { articles : null });
                console.error('Error', err.message);
            }
        } 
    }
    }
    else {
    response.redirect('/');
    }
});





module.exports = newsRouter;