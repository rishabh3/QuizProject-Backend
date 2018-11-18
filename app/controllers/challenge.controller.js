var jwt = require('jsonwebtoken'); 
var User = require('../models/user');
var authConfig = require('../../config/auth');
var questionnaire = require('../models/quizdata');
const EventEmitter = require('events');

const Stream = new EventEmitter();

exports.getQuestions = async function(req, res, next){
    var email = req.headers.email;
    var challenger = req.body.challenger;
    var challengee = req.body.challengee;
    var numberQuestions = 10 ; 
    var len = 272;

    if(email == challengee || email == challenger){
        return res.status(422).send({error: 'Cannot challenge yourself! I mean you can but no :)'});
    }
    var user = await User.findOne({email:email});
    if(!user)
        return res.status(422).send({error: 'No user found'});
    if(!challenger){ // First person to take the quiz
        var questions = JSON.parse(JSON.stringify(questionnaire), function(key, value) {
            return value; 
        },function(err){
            console.log(err);
        });
        var questionList = []
        for(var i=0; i<numberQuestions; i++){
            var key = getRandomkey(0,len);
            questionList.push(questions[0][key]);
        }
        // user['challenge'].append(questionList);
        // console.log(user.challenge);
        // questionList[0]["challengee"] = challengee;
        var user = await User.findOne({email:challengee});
        var data = {
            challenger: email,
            questions: questionList
        }
        user.challenge.push(data);
        try{
            await user.save();
        }catch(err){
            return res.status(422).send({error: err});
        }
        
        res.status(200).send(data);
    }
    else{ // Who has challeneged is given then retreieve from their db
        for(var i=0; i<user.challenge.length; i++){
            if(user.challenge[i].challenger == challenger){
                res.status(200).send(user.challenge[i]);
            }
        }
    }
    
}

//Find somebody to challenege and send them a challenge request
exports.challenge = async function(req, res, next){
    var email = req.headers.email;
    var user = await User.findOne({email:email});
    if(!user)
        return res.status(422).send({error: 'No user found'});
    var num = await User.countDocuments();

    var R = Math.floor(Math.random() * num)
    var chal = await User.findOne().limit(1).skip(R);
    var chal = await User.findOne();
    while(chal.email == user.email){
        R = Math.floor(Math.random() * num)
        chal = await User.findOne().limit(1).skip(R);
    }

    Stream.emit("challengeEvent",{"user": chal.name});
    res.status(200).send({"user": chal.name});
}

function getRandomkey(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }