const express = require('express');
const bodyParser = require('body-parser');
const multer = require("multer");
const app = express();
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const csv = require('csv-parser');
const sanitizeHtml = require('sanitize-html');

// Directory di destinazione per il caricamento dei file
const UPLOAD_DIRECTORY = 'public';
const COSTUME_JSON_PATH = path.join(UPLOAD_DIRECTORY, 'costumes.json');
app.use(bodyParser.urlencoded({ extended: true }));

// Assicurati che la cartella UPLOAD_DIRECTORY esista, altrimenti creala
if (!fs.existsSync(UPLOAD_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_DIRECTORY);
}

app.use(express.static(UPLOAD_DIRECTORY));
// Serve i file statici dalla cartella 'public' sotto la route '/public'
app.use('/public', express.static(UPLOAD_DIRECTORY));

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        cb(null, true);
    },
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIRECTORY);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/registration', (req, res) => {
    res.sendFile(__dirname + '/registration.html');
});

app.get('/vote', (req, res) => {
    const images = readJsonFile(COSTUME_JSON_PATH);
    let imageCardsHtml = '';
    let inputForm = ``;

    images.forEach((image) => {
        inputForm += `
        <label class="radio-button-label card">
            <p class="card-title">${image.nome}</p>
            <input type="radio" id="${image.nome}" name="voto" value="${image.nome}">
            <div class="gradBorder">
                <img class="card-image" src="/public/${image.nomeFile}" alt="${image.nome}" />
            </div>
        </label>
        `;
    });

    // inputForm += `</div>`;

    const votePageHtml = `
        <!DOCTYPE html>
        <html>
        
        <head>
            <title>Vota il miglior costume</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link
              rel="stylesheet"
              href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
              integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk"
              crossorigin="anonymous"
            /> 
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@100;200;300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
            <!-- Bootstrap icons-->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet" />
            <!-- Core theme CSS (includes Bootstrap)-->
            <link href="public/style.css" rel="stylesheet" />
            <style>

                body {
                }

                /* Nascondi il pulsante radio */
                input[type="radio"] {
                  display: none;
                }

                input[type="radio"]:checked + img {
                    border: 5px solid red;
                }

                input[type="radio"]:checked + .gradBorder {
                    border-width: 4px;
                    border-style: solid;
                    border-image: linear-gradient(135deg, #1e30f3 0%, #e21e80 100%) 1;
                }

                h1 {
                    text-align:center
                }

                // Gestione delle card
                .card {
                    margin: 0 auto; /* Centrare la card orizzontalmente */
                    border: 1px solid #ccc;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
        
                .card-title {
                    font-size: 1.2em;
                    padding: 10px;
                    text-align: center;
                }
        
                .card-image {
                    width: 100%;
                    display: block;
                }
            </style>
        </head>
        <body class="d-flex flex-column h-100">
            <main class="flex-shrink-0">
                <!-- Navigation-->
                <nav class="navbar navbar-expand-lg navbar-light bg-white py-3">
                    <div class="container px-5">
                        <a class="navbar-brand" href="/"><span class="fw-bolder text-primary">Halloween Costume Contest</span></a>
                    </div>
                </nav>
                <!-- Header-->
                <header class="pt-5">
                    <div class="container">
                        <div class="row gx-5 align-items-center">
                            <h1 class="display-3 fw-bolder"><span class="text-gradient d-inline">Quale costume vuoi votare?</span></h1>
                        </div>
                    </div>
                </header>
                <section class="bg-lights">
                    <div class="container px-5">
                        <div class="row gx-5 justify-content-center">
                            <div class="col-xxl-8">
                                <div class="text-center my-5">
                                    <form method="post" action="/vote">        
                                        ${inputForm}
                                        <div class="mb-3">
                                            <label for="Telefono" class="form-label">Il tuo Telefono:</label>
                                            <input class="form-control btn-lg px-5 py-3 me-sm-3 fs-6 fw-bolder" type="tel" id="Telefono" name="Telefono" placeholder="3661674724" required>
                                        </div>
                                        <input class="btn btn-primary btn-lg px-5 py-3 me-sm-3 fs-6 fw-bolder" type="submit" value="Invia">
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <!-- Footer-->
            <footer class="bg-white py-4 mt-auto">
                <div class="container px-5">
                    <div class="row align-items-center justify-content-between flex-column flex-sm-row">
                        <div class="col-auto"><div class="small m-0">PS: Non ci piace la privacy</div></div>
                    </div>
                </div>
            </footer>
            <!-- Bootstrap core JS-->
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
        `;

    res.send(votePageHtml);
});

function orderByProperty(array, property) {
    // Utilizza il metodo sort() per riordinare l'array in base alla proprietà specificata
    array.sort((a, b) => {
        if (a[property] < b[property]) {
            return -1;
        }
        if (a[property] > b[property]) {
            return 1;
        }
        return 0;
    });
}

function calculateWinner() {
    let costumes = readJsonFile(COSTUME_JSON_PATH);
    costumes.sort((a, b) => b.voto - a.voto);
    costumes = costumes.slice(0, 3);
    return costumes;
};

app.get('/classifica', (req, res) => {
    let classificaPage;
    classificaPage = `
        <!DOCTYPE html>
        <html>
        
        <head>
            <title>Vota il miglior costume</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link
              rel="stylesheet"
              href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
              integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk"
              crossorigin="anonymous"
            /> 
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@100;200;300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
            <!-- Bootstrap icons-->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet" />
            <!-- Core theme CSS (includes Bootstrap)-->
            <link href="public/style.css" rel="stylesheet" />
        </head>
        <body class="d-flex flex-column h-100">
            <main class="flex-shrink-0">
                <!-- Navigation-->
                <nav class="navbar navbar-expand-lg navbar-light bg-white py-3">
                    <div class="container px-5">
                        <a class="navbar-brand" href="/"><span class="fw-bolder text-primary">Halloween Costume Contest</span></a>
                    </div>
                </nav>
                <!-- Header-->
    `;
    // Leggi il parametro "avviso" dalla query string (se presente)
    const avviso = sanitizeHtml(req.query.voto);
    if (!avviso) {
        classificaPage += ``;
    } else {
        classificaPage += `
        <h2 style="text-align: center;">🦴🎉${avviso}🎉☠️</h2>
        `;
    }

    let classifica = calculateWinner();
    if (classifica.length > 0) {
        classificaPage += `
            <header class="pt-5">
                <div class="container">
                    <div class="row gx-5 align-items-center text-center">
                            <h1 class="display-3 fw-bolder"><span class="text-gradient d-inline">Classifica</span></h1>
                    </div>
                </div>
            </header>
            <section class="bg-lights">
                    <div class="container px-5">
                        `;
        for (let index = 0; index < classifica.length; index++) {
            classificaPage += `
            <div class="row gx-5 justify-content-center">
                <div class="col-xxl-8">
                    <div class="text-center my-2">
                        <h3>${(classifica[index]).nome}</h3>
                        <div class="badge bg-gradient-primary-to-secondary text-white mb-2">voti: ${(classifica[index]).voto}</div>
                        <div>    
                            <img src="/public/${(classifica[index]).nomeFile}" alt="${(classifica[index]).nome}" style="max-width: 100%;"/>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }
        classificaPage += `
                </div>
            </section>
        `;                        
    }
    classificaPage += `
            </main>
            <!-- Footer-->
            <footer class="bg-white py-4 mt-auto">
                <div class="container px-5">
                    <div class="row align-items-center justify-content-between flex-column flex-sm-row">
                        <div class="col-auto"><div class="small m-0">PS: Non ci piace la privacy</div></div>
                    </div>
                </div>
            </footer>
            <!-- Bootstrap core JS-->
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>`;

    res.send(classificaPage);
});

app.get('/registration_confirmation', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


app.post('/registration', (req, res) => {
    res.redirect('/registration');
});

const PARTECIPANTS_JSON_PATH = './partecipanti.json';


app.post('/vote', (req, res) => {

    let found = false;

    let partecipanti = readJsonFile(PARTECIPANTS_JSON_PATH);
    for (let index = 0; index < partecipanti.length && !found; index++) {
        if ((partecipanti[index]).Telefono == sanitizeHtml(req.body.Telefono) && (partecipanti[index]).Votato == 'no') {
            (partecipanti[index]).Votato = 'si';
            found = true;
        }
    }


    if (!found) {
        res.redirect('/classifica?voto=Hai già votato');
    } else {
        writeJsonFile(PARTECIPANTS_JSON_PATH, partecipanti, (err) => {
            if (err) {
                return res.status(500).send('Error while saving data with partecipants updated to JSON.');
            }
        });

        let votes = readJsonFile(COSTUME_JSON_PATH);
        for (let index = 0; index < votes.length; index++) {
            if ((votes[index]).nome === req.body.voto) {
                (votes[index]).voto++;
                writeJsonFile(COSTUME_JSON_PATH, votes, (err) => {
                    if (err) {
                        return res.status(500).send('Error while saving data with votes updated to JSON.');
                    }

                    console.log('Hai votato per ' + req.body.voto);
                });
                break;
            }
        }
        res.redirect('/classifica?voto=Hai votato per ' + req.body.voto);
    }

})

// Cambiato il nome della route da '/carica' a '/upload'
app.post('/upload', upload.single('image'), (req, res) => {
    const image = req.file;
    const imageName = sanitizeHtml(req.body.nome); // Modificato da req.body.name a req.body.nome

    if (!image) {
        return res.status(400).send('No image uploaded.');
    }

    const images = readJsonFile(COSTUME_JSON_PATH);
    if (images.find(img => img.nome === imageName)) {
        return res.status(400).send('An image with the same name already exists.');
    }

    sharp(image.buffer)
        .toFormat('jpeg')
        .toFile(path.join(UPLOAD_DIRECTORY, `${imageName}.jpg`), (err, info) => {
            if (err) {
                return res.status(500).send('Error during image conversion.');
            }

            images.push({
                nome: imageName, // Modificato da name a nome
                nomeFile: `${imageName}.jpg`,
                voto: 0
            });

            writeJsonFile(COSTUME_JSON_PATH, images, (err) => {
                if (err) {
                    return res.status(500).send('Error while saving data to JSON.');
                }

                res.redirect('/');
            });
        });
});

function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeJsonFile(filePath, data, callback) {
    fs.writeFile(filePath, JSON.stringify(data, null, 4), callback);
}

app.post('/votePage', (req, res) => {
    res.redirect('vote');
});

app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIRECTORY)));

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
