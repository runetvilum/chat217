/*jslint nomen: true */
/*jslint plusplus: true */
/*global require, console, __dirname, process, Buffer, setTimeout*/
(function () {
    'use strict';
    var Firebase = require("firebase"),
        config = require('./config'),
        winston = require('winston'),
        Queue = require('firebase-queue'),
        bodyParser = require('body-parser'),
        compress = require('compression'),
        cors = require('cors'),
        express = require('express'),
        app = express(),
        FirebaseTokenGenerator = require("firebase-token-generator"),
        tokenGenerator = new FirebaseTokenGenerator(config.firebase_token),
        ref = new Firebase("https://chat217.firebaseio.com/");
    winston.add(winston.transports.DailyRotateFile, {
        filename: 'chat217.log'
    });
    app.use(compress());
    /*app.use(cors({
        allowedHeaders: ["accept", "authorization", "content-type", "origin", "referer"]
    }));*/
    app.use(cors({
        credentials: true,
        origin: function (origin, callback) {
            callback(null, true);
        }
    }));

    app.use(bodyParser.json({
        limit: '100mb'
    }));
    //app.get('/:email/:password', function (req, res) {
    app.post('/', function (req, res) {
        /*if (!req.body || !req.body.email || !req.body.password) {
            return res.status(400).send(JSON.stringify({
                ok: false,
                message: 'email og password er påkrævet.'
            }));
        }*/
        var couchdb = require('nano')({
            url: 'http://localhost:80'
        });
        //couchdb.auth(req.params.email, req.params.password, function (err, body, headers) {
        couchdb.auth(req.body.email, req.body.password, function (err, body, headers) {
            if (err) {
                return res.status(err.status_code || 500).send(err);
            }
            console.log(body);
            var token = tokenGenerator.createToken({
                uid: "custom:" + req.body.email,
                sagsbehandler: true
            });
            res.json({
                token: token
            });
        });
    });
    app.listen(4001);
    console.log('Listening on port 4001');
    winston.remove(winston.transports.Console);
    winston.info('start');
    ref.authWithCustomToken(config.firebase_token, function (error, authData) {
        if (error) {
            winston.info(error);
        } else {
            var obsQueue = new Queue(ref.child('queue'), function (data, progress, resolve, reject) {
                winston.info(data.chat);
                var doc = {
                    uid: data.chat.uid,
                    timestamp: Date.now()
                };
                if (data.chat.msg) {
                    doc.msg = data.chat.msg;
                }
                if (data.chat.img) {
                    doc.img = data.chat.img;
                }
                ref.child('chatroom').child(data.chat.room).push(doc, function (err) {
                    if (err) {
                        reject();
                    } else if (doc.uid.indexOf('custom') === -1) {
                        ref.child('sagsbehandler').push(doc, function (err) {
                            if (err) {
                                reject();
                            } else {
                                resolve();
                            }
                        }).setPriority(-doc.timestamp);
                    } else {
                        resolve();
                    }

                }).setPriority(doc.timestamp);
            });
            ref.child('queue/tasks').orderByChild('_state').equalTo('error').on('child_added', function (child) {
                setTimeout(function () {
                    var v = child.val(),
                        id = child.key(),
                        s = v._error_details.previous_state.replace("_in_progress", "");
                    winston.info("error", v);
                    ref.child('queue/tasks').child(id).child('_state').set(s);
                }, 60000);
            });

        }
    });
}());