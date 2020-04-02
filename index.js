const FormData = require('form-data');
const axios = require('axios');

const fs = require('fs');

const crypto = require('crypto');

const nomeArquivo = 'answer.json';

/**
 * Verifica se existe o arquivo json populado apos a primeira chamada da requisicao https.
 * Evita ficar consumindo a api desncessariamente.
 */
fs.exists(nomeArquivo, (exists) => {
    if(!exists) {
        console.log('Arquivo nao existe. Iniciando requisicao http...');
        getHttpFileJSON(url);
    }
    readAndCreateFileJSON();
    console.log("--------------------");
    console.log("Enviando JSON - POST:");
    sendFileJSON();
});

function sendFileJSON() {
    const form = new FormData();

    form.append('answer', fs.createReadStream(nomeArquivo), {
        filename: 'answer.json'
    });

    axios.create({
        headers: form.getHeaders()
    }).post(`https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${TOKEN}`, form).then(
        response => {
            console.log('response: ', response);
            console.log('Envio realizado com sucesso!');
        }).catch(error => {
            if(error.response) {
                console.log(error.response);
            }
            console.log(error.message);
        });
}

function readAndCreateFileJSON() {
    fs.readFile(nomeArquivo, async (err, data) => {
        if (err)
            throw err;
        let obj = await JSON.parse(data);
        const textoCifrado = obj['cifrado'];
        const numeroCasas = obj['numero_casas'];
        var textoDescifrado = "";
        textoDescifrado = descriptoText(textoCifrado, textoDescifrado, numeroCasas);
        const txtResumoHash = criptoSha1(textoDescifrado);
        console.log("hash (sha1): " + txtResumoHash);
        // inserindo os novos valores no objeto JSON answer
        obj['decifrado'] = textoDescifrado;
        obj['resumo_criptografico'] = txtResumoHash;
        console.log(obj);
        
        createOrReplaceFileJSON(obj);
    });
}

/**
 * Descriptografa o texto vindo do arquivo json com a regra a partir do numero_casas
 * @param {string} textoCifrado 
 * @param {string} textoDescifrado 
 * @param {number} numeroCasas 
 */
function descriptoText(textoCifrado, textoDescifrado, numeroCasas) {
    for (let index = 0; index < textoCifrado.length; index++) {
        const letra = textoCifrado[index];
        var charCode = letra.charCodeAt(0); // ascii table
        if (charCode === 46 /* "." */ || charCode === 32 || charCode === 34 /*blank*/
            || (charCode >= 48 && charCode <= 57) /*numeros*/) {
            textoDescifrado += letra;
        }
        else {
            switch (charCode - numeroCasas) {
                case 96:
                    textoDescifrado += 'z';
                    break;
                case 95:
                    textoDescifrado += 'y';
                    break;
                case 94:
                    textoDescifrado += 'x';
                    break;
                case 93:
                    textoDescifrado += 'w';
                    break;
                case 92:
                    textoDescifrado += 'v';
                    break;
                case 91:
                    textoDescifrado += 'u';
                    break;
                default:
                    var letraDescifrada = String.fromCharCode(charCode - numeroCasas);
                    textoDescifrado += letraDescifrada;
                    break;
            }
        }
    }
    return textoDescifrado;
}

function criptoSha1(txtDecifrado) {
    var hash = crypto.createHash('sha1');
    data = hash.update(txtDecifrado, 'utf-8');
    gen_hash= data.digest('hex');
    return gen_hash;
}

function createOrReplaceFileJSON(data) {
    fs.writeFile(nomeArquivo, JSON.stringify(data), function(err) {
        if (err) throw err;
        console.log(`Arquivo '${nomeArquivo}' criado com sucesso.`);
    });
}

const TOKEN = "189973b34562aeeb7a61e98ec4d3aeabfe4c372d";
const url = `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${TOKEN}`;

/**
 * Realiza a requisicao http de acordo com a URL passada para buscar o arquivo JSON
 */
const getHttpFileJSON = async url => {
    try {
        const response = await axios.get(url);
        const data = response.data;
        console.log(data);
        createOrReplaceFileJSON(data);
    } catch (error) {
        console.log(`Ocorreu um erro: ${error}`);
    }
  };
  