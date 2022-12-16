const express = require('express');
const app = express();
var http = require('http').Server(app);
const cors = require('cors');
const bodyParser = require("body-parser");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios'); 
var fileSystem = require('fs');
var path = require('path');
require ('custom-env').env();
const ACCESS_KEY = process.env.ACCESS_KEY;
const REGION = process.env.REGION;
console.log(ACCESS_KEY);
console.log(process.env.PORT);
var corsOptions = {   origin: '165.22.191.246:3000',   optionsSuccessStatus: 200 }
const options = {
	swaggerDefinition: {
		info: {
			title: 'Final Project',
			version: '1.0.0',
			description: 'Final Project by Angel Regi'
		},
		host: '165.22.191.246:3000',
		basePath: '/',
		},
		apis: ['./index.js'],
};

const specs = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

/*app.use(cors({
    origin: '*'
}));*/
app.use(cors(corsOptions));
app.use((req, res, next) => { // router middleware
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN || "*");
    next();
});
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/home.html');
});

const { SpeechSynthesisOutputFormat, SpeechConfig, AudioConfig, SpeechSynthesizer } = require("microsoft-cognitiveservices-speech-sdk");

/**  
* @swagger
* /text:  
*    post:
*       description: Post the text to be converted to speech   
*       consumes:
*            - application/x-www-form-urlencoded
*       produces:
*           - text/html
*       parameters:
*            - name: textcontent
*              in: formData
*              description: text to be converted
*              required: true
*              type: string
*       responses:  
*          200:  
*              description: download.html page as response 
*  
*/

app.post('/text',  async (req, res) => {
    const reqbody = req.body;
    console.log(req.body);
    console.log(ACCESS_KEY);
        try {

            const url = "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1";
        let config = {
            headers : {
                "Ocp-Apim-Subscription-Key" : ACCESS_KEY,
                "Content-Type" : "application/ssml+xml",
                "X-Microsoft-OutputFormat" : "audio-16khz-32kbitrate-mono-mp3"
            }
        }
        
        var data = "<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' xml:gender='Male' name='en-US-ChristopherNeural'> " + reqbody.textcontent + " </voice></speak> ";

        axios.post(url, data, config)
        .then((response) => {
            const speechConfig = SpeechConfig.fromSubscription(ACCESS_KEY, REGION);
            speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
            const audioConfig = AudioConfig.fromAudioFileOutput("output.mp3");
        
            const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
            synthesizer.speakTextAsync(
               reqbody.textcontent,
                result => {
                    if (result) {
                        console.log(JSON.stringify(result));
                    }
                    synthesizer.close();
                    res.status(200);
                    res.sendFile(__dirname + '/download.html');
                },
                error => {
                    console.log(error);
                    synthesizer.close();
                    res.send("error");
                });
        })
        .catch(error => {
            res.status(500);
            res.send(error);
            console.log(error);
        })
    } catch(err) {
        res.status(500);
        res.send("Error in processing the text");
    }
    
});


/**  
* @swagger
* /download:  
*    get:
*       description: Download the audio file 
*       responses:  
*          200:  
*              description: output.mp3 as response
*  
*/

app.get('/download',function(req,res) {

    res.download(__dirname + '/output.mp3', function(err) {
        if(err) {
            res.status(500);
            console.log(err);
        } else {
            res.status(200);
        }
    })
})

app.get('/audiofile',function(req,res) {
     
    var filePath = path.join(__dirname, 'output.mp3');
    var stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
})

http.listen(3000, function(){
    console.log('listening on localhost:3000');
 });