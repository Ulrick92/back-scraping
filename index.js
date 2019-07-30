// Le framework Express permet de créer un serveur
const express = require("express");
app = express();
// Un middleware permettant de gérer les données postées par un formulaire par exemple
const bodyParser = require("body-parser");
// Le package `mongoose` est un ODM (Object-Document Mapping) permettant de
// manipuler les documents de la base de données comme si c'étaient des objets
const mongoose = require("mongoose");
// Module pour le scaping avec le framework JQuery
const cheerio = require("cheerio");
// Permet de faire des requêtes http
const request = require("request");
// `Cross-Origin Resource Sharing` est un mechanisme permettant d'autoriser les
// requêtes provenant d'un nom de domaine different
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());
// un plugin pour Cheerio qui vous permet de transformer l'extraction de données
const jsonframe = require("jsonframe-cheerio");
const port = 3000;

// Connexion à la BDD "scraping"
mongoose.connect("mongodb://localhost:27017/scraping", {
  useNewUrlParser: true,
  useCreateIndex: true
});

// Création d'un model
const webSiteTextModel = mongoose.model("Text", {
  text: {
    type: String
  }
});

app.get("/scrap", (req, res) => {
  // Requête sur url, s'il n'y a pas d'erreur et que le code http est 200 (succès de la requête)
  // on procède au scraping en précisant la balise sur laquelle nous voulons récupérer les données
  request("https://www.lereacteur.io", (error, response, html) => {
    if (!error && response.statusCode === 200) {
      const $ = cheerio.load(html);
      jsonframe($);
      let frame = {
        fullText: "#___gatsby"
      };
      let output = $("body").scrape(frame);
      // console.log(output.fullText);

      const webSiteText = new webSiteTextModel({
        text: output.fullText
      });

      // La méthode "find" renvoie un tableau de la collection "webSiteTextModel"
      // s'il est vide on réccupère le texte et on le sauvegarde
      webSiteTextModel.find().exec((err, webSiteTextCollection) => {
        if (!err) {
          if (!webSiteTextCollection.length) {
            webSiteText.save();
          }
        } else {
          res.status(400).json(err.message);
        }
      });
    } else {
      res.status(400).json(error);
    }
  });
  // On renvoie un tableau d'objet de la collection "webSiteTextModel"
  webSiteTextModel.find({}).exec((err, webSiteText) => {
    if (!err) {
      res.status(200).json(webSiteText);
    } else {
      res.status(400).json(err);
    }
  });
});

// Toutes les méthodes HTTP (GET, POST, etc.) des pages non trouvées afficheront
// une erreur 404
app.all("*", function(req, res) {
  res.status(404).send("Page introuvable");
});

// On écoute le serveur ici sur le port 3000 et on vérifie qu'il tourne
app.listen(port, () => {
  console.log("Server starting");
});
