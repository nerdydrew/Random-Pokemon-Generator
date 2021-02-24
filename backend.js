const http = require('http');
const fs = require('fs');
const api = require('./api/api')


let path = ".";
const server = http.createServer(function (req, res) {
    path = "." + req.url;
    console.log(`\${req.method} request received at \${req.url}`);
    // if (req.url === '/html') {
    //     res.setHeader('Content-Type', 'text/html');
    //     res.statusCode = 200; // 200 = OK
    //     displayHTML(res);
    //     res.end();
    // } else if (req.url === '/plain') {
    //     res.setHeader('Content-Type', 'text/plain');
    //     res.statusCode = 200; // 200 = OK
    //     res.write("<h1>Demo page</h1>");
    //     res.end();
    // } else if (req.url === '/json') {
    //     res.setHeader('Content-Type', 'application/json');
    //     res.statusCode = 200; // 200 = OK
    //     res.write(JSON.stringify({"firstName": "Harry", "lastName": "Potter"}));
    //     res.end();
    if (req.url === '/') {
         res.setHeader('Content-Type', 'text/html');
         res.statusCode = 200; // 200 = OK
         displayHTML(res);
         res.end();
    
    // JSON Files
    } else if (req.url.match(/api\?/g)) {
         res.setHeader('Content-Type', 'application/json');
         res.statusCode = 200; // 200 = OK
         let splits = req.url.split("?");
         let return_json = JSON.stringify(api.getRandomPokemonJson(splits[1]), null, 1);
         res.write(return_json);
         res.end();
    } else if (req.url.match(/\.json/g)) {
        fs.access(path, fs.constants.F_OK | fs.constants.R_OK, (err) => {
            console.log(`${path} ${err ? 'does not exist' : 'exists'}`);
            if(err === null) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200; // 200 = OK
                res.write(fs.readFileSync(path));
                res.end();
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.statusCode = 400; // 400 = Bad request
                res.write("<h1>Sorry, this page is not available</h1>");
                res.end();
            }
          });
    
    } 
    //Images
    else if (req.url.match(/\.png/g)) {
        
        fs.access(path, fs.constants.F_OK | fs.constants.R_OK, (err) => {
            console.log(`${path} ${err ? 'does not exist' : 'exists'}`);
            if(err === null) {
                res.setHeader('Content-Type', 'image/png');
                res.statusCode = 200; // 200 = OK
                res.write(fs.readFileSync(path));
                res.end();
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.statusCode = 400; // 400 = Bad request
                res.write("<h1>Sorry, this page is not available</h1>");
                res.end();
            }
          });
    }
    // CSS Files
    else if (req.url.match(/\.css/g)) {
        fs.access(path, fs.constants.F_OK | fs.constants.R_OK, (err) => {
            console.log(`${path} ${err ? 'does not exist' : 'exists'}`);
            if(err === null) {
                res.setHeader('Content-Type', 'text/css');
                res.write(fs.readFileSync(path))
                res.statusCode = 200;
                res.end();
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.statusCode = 400; // 400 = Bad request
                res.write("<h1>Sorry, this page is not available</h1>");
                res.end();
            }
          });
          // Javascript
    } else if (req.url.match(/\.js/g)) {
        fs.access(path, fs.constants.F_OK | fs.constants.R_OK, (err) => {
            console.log(`${path} ${err ? 'does not exist' : 'exists'}`);
            if(err === null) {
                res.setHeader('Content-Type', 'text/javascript');
                res.write(fs.readFileSync(path))
                res.statusCode = 200;
                res.end();
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.statusCode = 400; // 400 = Bad request
                res.write("<h1>Sorry, this page is not available</h1>");
                res.end();
            }
          });
    } 
     else {
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 400; // 400 = Bad request
        res.write("<h1>Sorry, this page is not available</h1>");
        res.end();
    }
});

server.listen(3000, function () {
    console.log("Listening on port http://localhost:3000");
});


function displayHTML(res) {
    let data = fs.readFileSync("./index.html");
    res.write(data);
    // fs.readFileS('./index.html', null, function (error, data) {
    //     if (error) {
    //         res.writeHead(404);
    //         res.write('Whoops! File not found!');
    //     } else {
    //         res.write(data);
    //     }
    //     res.end();
    // });
}