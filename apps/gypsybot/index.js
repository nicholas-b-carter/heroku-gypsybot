var alexa = require('alexa-app');
var readlineSync = require('readline-sync');
var request = require('request');
var deasync = require('deasync');
var utuClient = require('utu');

var appId = 'amzn1.ask.skill.314479d6-a797-45cf-8f59-28d17c663fa4';

var app = new alexa.app('gypsybot');
var utu = new utuClient.Client('c0c4a8fae8e7402c819b2e0c78c902b1');

app.launch(function(req,res) {
  var user = {
    platform: utuClient.constants.ALEXA,
    platformId: req.userId,
    // 1. xxxx: appId,  //what do we do w/ this?
    values: {
      firstName: 'Jimmie',
      lastName: 'Butler',
      location: 'Philadelphia',
      favoriteColor: 'Blue',
      hobbies: 'Cooking, Hiking',
      email: 'jimmie@utu.ai'
      // 2.
      // we derive on server side
      // firstSeen: new Date(),
      // lastSeen: new Date(),
    },
  };

  utu.user(user).then((res) => console.log(res)).catch((err) => console.log(err));

  console.log('user: ', user);
  var message = 'What sunsign would you like a horoscope for?  And for the day, week, month, or year?';
  res.say(message)
     .reprompt('Please say a sunsign followed by day, week, month, or year.')
     .shouldEndSession(false);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: req.userId,
    // 1. xxxx: appId,  //what do we do w/ this?
    values: {
      sessionId: req.sessionId,
      message: message,
      rawMessage: {
       text: message,
      },
      botMessage: true,
    },
  });
});

module.exports = app;

app.intent('getHoroscope', {
  'slots': {
    'SunSign': 'SUNSIGN',
    'Hday': 'HDAY'
  },
  'utterances': [
    'get {a|the|} horoscope for {-|SunSign}',
    'get {-|SunSign} {horoscope|} for {-|Hday}',
    '{get| what is} {the|this|} {-|Hday} horoscope for {-|SunSign}',
  ]
}, function(req,res) {
  var sign = req.slot('SunSign');
  var hday = req.slot('Hday') || '';
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: req.userId,
    // userId: req.userId,
    values: {
      sessionId: req.sessionId,
      message: `${sign} ${hday}`,
      rawMessage: {
        text:  `${sign} ${hday}`,
      },
      botMessage: false,
    },
  });
  if (sign) {
    var message = '';
    sign = sign.replace(/,\s*$/, '');
    utu.event("Asked for Horoscope", {
      platform: utuClient.constants.ALEXA,
      platformId: req.userId,
      // userId: req.userId,
      // sessionId: req.sessionId,
      values: {
        "sign": sign,
        "type": hday,
      },
    });
    var h = getHoroscope(sign, hday);
    if (!h.error) {
      var greet = '';
      switch (h.day) {
        case "week":
          greet = 'The weekly ';
          break;
        case "month":
          greet = 'The monthly ';
          break;
        case "year":
          greet = 'The yearly ';
          break;
        default:
          greet = `Today's, ${h.date}, `;
      }
      utu.event("Gave Horoscope", {
        platform: utuClient.constants.ALEXA,
        platformId: req.userId,
        // userId: req.userId,
        // sessionId: req.sessionId,
        values: {
          sessionId: req.sessionId,
          "horoscope": h.horoscope,
        },
      });
      message = `${greet} horoscope for ${h.sunsign} is... "${h.horoscope}"`;
    } else {
      message = "Sorry, I can't find a horoscope for that sunsign.  Try again`?";
      utu.event("Horoscope error: ", {
        platform: utuClient.constants.ALEXA,
        platformId: req.userId,
        // userId: req.userId,
        // sessionId: req.sessionId,
        values: {
          sessionId: req.sessionId,
          "sign": sign,
          "type": hday,
        },
      });
    }
  } else {
    message = 'Try again?  Please say a sunsign followed by day, week, month, or year.';
  }
  res.say(message).shouldEndSession(false);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: req.userId,
    // userId: req.userId,
    values: {
     sessionId: req.sessionId,
     message: message,
     rawMessage: {
       text: message,
     },
     botMessage: true,
    },
  });
});

app.intent('AMAZON.CancelIntent', {
  'slots': {},
  'utterances': []
}, function(req,res) {
  res.say('Goodbye.').shouldEndSession(true);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {
     message: 'Goodbye.',
     rawMessage: {
       text: 'Goodbye.',
     },
     botMessage: true,
    },
  });
});

app.intent('AMAZON.StopIntent', {
  'slots': {},
  'utterances': [
    '{quit|exit|thanks|bye|thank you}'
  ]
}, function(req,res) {
  res.say('Goodbye.').shouldEndSession(true);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {
     message: 'Goodbye.',
     rawMessage: {
       text: 'Goodbye.',
     },
     botMessage: true,
    },
  });
});

app.intent('AMAZON.HelpIntent', {
  'slots': {},
  'utterances': []
}, function(req,res) {
  utu.event("Asked for help", {
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {},
  });
  message = `GypsyBot is a simple horoscope bot.  If you tell it your sunsign
  and then if you want the horoscope for today, the week, month, or year, GypsyBot
  will tell you your horoscope.`;
  res.say(message).shouldEndSession(false);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {
     message: message,
     rawMessage: {
       text: message,
     },
     botMessage: true,
    },
  });
});

app.intent('exit', {
  'slots': {},
  'utterances': [
    '{quit|exit|thanks|bye|enough}'
  ]
}, function(req,res) {
  utu.event("Exited", {
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {
      endTime: new Date(),
    },
  });
  res.say('Goodbye.').shouldEndSession(true);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {
     message: 'Goodbye.',
     rawMessage: {
       text: 'Goodbye.',
     },
     botMessage: true,
    },
  });
});

app.intent('AMAZON.StartOverIntent', {
  'slots': {},
  'utterances': []
}, function(req,res) {
  var message = 'Please say a sunsign followed by day, week, month, or year.';
  res.say(message).shouldEndSession(false);
  utu.message({
    platform: utuClient.constants.ALEXA,
    platformId: appId,
    userId: req.userId,
    sessionId: req.sessionId,
    values: {
     message: message,
     rawMessage: {
       text: message,
     },
     botMessage: true,
    },
  });
});

function getHoroscope(sign, hday) {
  var horoscope = null;
  var myDate = 'today';
  switch (hday) {
    case 'week':
      myDate = 'week';
      break;
    case 'month':
      myDate = 'month';
      break;
    case 'year':
      myDate = 'year';
      break;
    default:
  }
  var url = 'http://horoscope-api.herokuapp.com/horoscope/' + myDate + '/' + sign;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      body = JSON.parse(body)
      horoscope = {
        day: myDate,
        date: body.date,
        horoscope: body.horoscope,
        sunsign: body.sunsign,
      }
   } else {
     // got a non 200 response back
     horoscope = { error: error };
   }
  });
  deasync.loopWhile(function() {
    return !horoscope;
  });
  return horoscope;
}
