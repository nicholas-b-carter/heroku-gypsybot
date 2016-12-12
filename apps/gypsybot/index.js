var alexa = require('alexa-app');
var readlineSync = require('readline-sync');
var request = require('request');
var deasync = require('deasync');

var app = new alexa.app('gypsybot');

app.launch(function(req,res) {
  res.say('What sunsign would you like a horoscope for?  And for the day, week, month, or year?')
     .reprompt('Please say a sunsign followed by day, week, month, or year.')
     .shouldEndSession(false)
});

module.exports = app;

app.intent('getHoroscope', {
  'slots': {
    'SunSign': 'SUNSIGN',
    'Hday': 'HDAY'
  },
  'utterances': [
    'get {a|the|} horoscope for {-|SunSign}',
    'get {-|SunSign} {horoscope|} for {-|Hday|}',
    '{get| what is} {the|this|} {-|Hday|} horoscope for {-|SunSign}',
  ]
}, function(req,res) {
  var sign = req.slot('SunSign');
  var hday = req.slot('Hday') || '';
  console.log('have sign: ', sign, ' and day: ', hday);
  if (sign) {
    var message = '';
    sign = sign.replace(/,\s*$/, '');
    console.log('calling getHoroscope...');
    var h = getHoroscope(sign, hday);
    console.log('horoscope: ', h);
    if (!h.error) {
      res.session('horoscope', h);
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
      message = `${greet} horoscope for ${h.sunsign} is... "${h.horoscope}"`;
    } else {
      message = "Sorry, I can't find a horoscope for that sunsign.  Try again`?";
    }
  } else {
    message = 'Try again?  Please say a sunsign followed by day, week, month, or year.';
  }
  res.say(message).shouldEndSession(false);
} );

// app.intent('getSign', {
//   'slots': {
//     'BirthDate': 'BIRTHDATE',
//   },
//   'utterances': [
//     'what is the sign for {}',
//   ]
// }, function(req,res) {
//   var message = '';
//   var birthdate = req.slot('BirthDate');
//   if (birthdate) {
//     var message = '';
//     birthdate = birthdate.replace(/,\s*$/, '');
//     var sign = getSign(birthdate);
//     if (!sign.error) {
//       res.session('sign', sign);
//       message = 'Ok. I found your sign ' + sign;
//     } else {
//       message = "Sorry, I can't find a sign for that date.  Whats the birthdate again?";
//     }
//   } else {
//     message = 'Please repeat the birthdate again.';
//   }
//   res.say(message).shouldEndSession(false); }
// );

app.intent('AMAZON.CancelIntent', {
  'slots': {},
  'utterances': []
}, function(req,res) {
  res.say('Goodbye.').shouldEndSession(true);
});

app.intent('AMAZON.StopIntent', {
  'slots': {},
  'utterances': [
    '{quit|exit|thanks|bye|thank you}'
  ]
}, function(req,res) {
  res.say('Goodbye.').shouldEndSession(true);
});

app.intent('AMAZON.HelpIntent', {
  'slots': {},
  'utterances': []
}, function(req,res) {
  message = `GypsyBot is a simple horoscope bot.  If you tell it your sunsign
  and then if you want the horoscope for today, the week, month, or year, GypsyBot
  will tell you your horoscope.`;
  res.say(message).shouldEndSession(false);
});

app.intent('exit', {
  'slots': {},
  'utterances': [
    '{quit|exit|thanks|bye|enough}'
  ]
}, function(req,res) {
  res.say('Goodbye.').shouldEndSession(true);
});

app.intent('AMAZON.StartOverIntent', {
  'slots': {},
  'utterances': []
}, function(req,res) {
  res.say('Please say a sunsign followed by day, week, month, or year.').shouldEndSession(false);
});

function getHoroscope(sign, hday) {
  var horoscope = null;
  //today, week, month, year
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
  console.log('url: ', url);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      body = JSON.parse(body)
      console.log('body json: ', body);
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
