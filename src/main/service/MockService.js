"use strict";

var fs = require('fs');
var path = require('path');
var winston = require('winston');
var ResponseManager = require('./ResponseManager');

class MockService {
    constructor(directory, app) {
        this.directory = directory;
        this.app = app;
        this.init();
    }

    init() {
        this.readDirectory(this.directory);
    }

    readDirectory(directory) {
        fs.readdir(directory, (err, files) => {
            if (err) {
                return winston.error("Error reading file.", err);
            }
            files.forEach((file, index) => {
                var fullPath = path.join(directory, file);

                fs.stat(fullPath, (error, stat) => {
                    if (error) {
                        return winston.error("Error stating file.", error);;
                    }
                    if (stat.isFile()) {
                        this.loadServiceFromFile(directory, file);
                    } else if (stat.isDirectory()) {
                        this.readDirectory(fullPath);
                    }
                });
            });
        });
    }

    loadServiceFromFile(directory, file) {
        let fullPath = path.join(directory, file);
        if (file == "service.json") {
            winston.info("Load file " + fullPath);
            fs.readFile(fullPath, 'utf8', (err, data) => {
                let service = JSON.parse(data);
                let request = service.request;
                let responses = service.responses;
                winston.info("Load service " + request.uri);
                let responseManager = new ResponseManager(directory, request, responses);
                switch (request.verb) {
                    case 'get':
                        this.app.get(request.uri, responseManager.callback);
                        break;
                    case 'post':
                        this.app.post(request.uri, responseManager.callback);
                        break;
                    default:
                        break;
                }
            });
        }
    }



}

module.exports = MockService;