const debug = require('debug')("app");
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// {pathToken:"", botToken: ""}
const configData = require('./data.json'); // don't save this file to git
const { Config } = require('./config');
const config = Config.config;
Config.update(configData);
debug({config});

config.mediaPath = `/${config.pathToken}${config.mediaPath}`;
updateManifest(config.pathToken, Config.manifest);

var app = express();
debug("Environment:", (process.env.NODE_ENV=="dev")?"Development":"Production");
app.use(logger('combined', {stream: createLogStream()}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(`${config.mediaPath}`, (req,res, next)=>{
    // Zendesk use POST to get static files so rewrite method 
    if ("POST" == req.method) {
        req.method = "GET";
    }
    next();
});
if (config.mediaDir) {
    app.use(`${config.mediaPath}`, express.static(config.mediaDir));
} else {
    app.use(`${config.mediaPath}`, express.static(path.join(__dirname, 'media')));
    config.mediaDir = path.join(__dirname, 'media');
}

const { Session } = require('./session');
const session = new Session(config.redisUrl);
const { Zendesk } = require('./zendesk');
const zendesk = new Zendesk(config.subdomain, config.instance_push_id, config.zendesk_access_token);
const { Bot } = require('./bot');
const bot = new Bot(zendesk, session);
zendesk.bot = bot;
bot.token = config.botToken;
bot.asyncInit(config.useWebhook);
debug("bot route", `/${config.pathToken}${config.botPath}`);
if (config.useWebhook) {
    app.post(`/${config.pathToken}${config.botPath}`, (req, res)=>{
        bot.botHandler(req, res);
    });
}

// Health check use
app.get(`/`, async (req, res)=>{
    await session.retrieve("nothing");
    res.sendStatus(200);
});

// zendesk channel route
app.get(`/${config.pathToken}/channel/manifest`, (req, res)=>{
    zendesk.manifest(res);
});

app.post(`/channel/admin_ui`, (req, res)=>{
    zendesk.admin_ui(req, res);
});

// Visible to users so don't set tokenPath
// ken, name, return_url
app.post('/channel/admin_ui_2', async (req, res)=>{
    // setupBot(req, config.useWebhook);
    zendesk.admin_ui_2(req, res);
});

app.post(`/${config.pathToken}/channel/pull`, (req,res)=>{
    // resetBot(req, config.useWebhook);
    zendesk.pull(req, res);
}); 


app.post(`/${config.pathToken}/channel/channelback`, (req, res)=>{
    // resetBot(req, config.useWebhook);
    zendesk.channelback(req, res);
});

// utility route
app.post(`/${config.pathToken}/channel/event_callback`, (req, res)=>{
    console.log("Event callback");
    console.log(req.body);
    res.sendStatus(200);
});

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

function updateManifest (pathToken, manifest) {
    let urls = manifest.urls;
    for (const url in urls) {
        if ((url!="admin_ui")&&(url!="admin_ui_2")) {
            urls[url] = `/${pathToken}${urls[url]}`;
        }
    }
}

function createLogStream () {
    let FileStreamRotator = require('file-stream-rotator');
    let fs = require('fs');

    let  logDirectory = path.join(__dirname, 'log');
    // ensure log directory exists
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
    // create a rotating write stream
    let  accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: path.join(logDirectory, 'access-%DATE%.log'),
        frequency: 'daily',
        verbose: false
    })
    return accessLogStream;
}
module.exports = app;
