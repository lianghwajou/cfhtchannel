var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


const { config } = require('./config');



const { Zendesk } = require('./zendesk');
const zendesk = new Zendesk();

// zendesk channel route
app.get('/channel/manifest', (req, res)=>{
  zendesk.manifest(res);
});

app.post('/channel/admin_ui', (req, res)=>{
  zendesk.admin_ui(req, res);
});

//token, name, return_url
app.post('/channel/admin_ui_2', async (req, res)=>{
  await setupBot(req.body.token, false);
  zendesk.admin_ui_2(req, res);
});


async function setupBot(token, useWebhook) {
  console.log("asyncInit");
  const { Bot } = require('./bot');
  const bot = new Bot(token, zendesk);
  zendesk.bot = bot;
  await bot.asyncInit(useWebhook);
  if (useWebhook) {
    app.post(config.botPath, bot.botHandler.bind(bot));
  } else {
    app.post('/channel/pull', (req,res)=>{
      zendesk.pull(req, res);
    }); 

  }

}


app.post('/channel/channelback', (req, res)=>{
  zendesk.channelback(req, res);
});

// utility route
app.post('/event_callback', (req, res)=>{
  console.log('Event callback:');
  console.log(req);
  res.sendStatus(200);
});

app.get('/channel/healthcheck', (req, res) => {
  res.send('ok');
});

// app.post('/telegraf/7e248f4e35730bc3d9a39e15b0e8075dd3af712621fa3dcc3703fb673576afce', (req, res)=>{
//   console.log("telegram update");
// })


function event_callback(req, res) {

}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
