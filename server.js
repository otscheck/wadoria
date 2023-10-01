require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const net = require("net");
const sqlite3 = require("sqlite3").verbose();
const port = 3000;
const ports = 80;

// Configurer le serveur Express
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Création et ouverture de la base de données
const db = new sqlite3.Database("ESP32.db", (err) => {
  if (err) {
    console.error(
      "Erreur lors de l'ouverture de la base de données :",
      err.message
    );
  } else {
    console.log("Base de données SQLite ouverte avec succès !");

    // Création de la table 'data' si elle n'existe pas déjà
    db.run(
      `CREATE TABLE IF NOT EXISTS data(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT,
      received_data TEXT,      
      name_data TEXT
    )`,
      (err) => {
        if (err) {
          console.error(
            "Erreur lors de la création de la table data :",
            err.message
          );
        } else {
          console.log("Table data créée avec succès !");
        }
      }
    );
  }
});

// Définir la route pour renvoyer les données de la base de données
app.get("/toutes-les-donnees", (req, res) => {
  const selectQuery = "SELECT * FROM data";
  db.all(selectQuery, (err, rows) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des données :",
        err.message
      );
      res.status(500).send("Erreur lors de la récupération des données");
    } else {
      console.log("Données récupérées avec succès !");
      res.json(rows);
    }
  });
});

// Fonction pour enregistrer les données
function saveData(data) {
  const receivedData = data.toString().trim();
  console.log("Données reçues de l'ESP32 : " + receivedData);

  let nameData = "";

  if (receivedData === "null") {
    console.log("Aucune carte RFID détectée.");
    nameData = "Aucune carte RFID détectée";
  } else {
    console.log("Carte RFID détectée. UID : " + receivedData);

    if (receivedData === "69e85d47") {
      nameData = "coin gauche";
    } else if (receivedData === "9641fb25") {
      nameData = "coin droit";
    } else {
      nameData = "milieu";
    }
  }

  // Vérifier l'existence des données dans la base de données
  const selectVQuery = "SELECT * FROM data WHERE timestamp = CURRENT_TIMESTAMP";
  db.get(selectVQuery, (err, row) => {
    if (err) {
      console.error(
        "Erreur lors de la vérification de l'existence des données :",
        err.message
      );
    } else {
      if (row) {
        console.log("Les données existent déjà dans la base de données");
      } else {
        // Enregistrer les données dans la base de données SQLite
        const insertQuery = `INSERT INTO data (timestamp, received_data, name_data) VALUES (CURRENT_TIMESTAMP, ?, ?)`;
        db.run(insertQuery, receivedData, nameData, function (err) {
          if (err) {
            console.error(
              "Erreur lors de l'enregistrement des données :",
              err.message
            );
          } else {
            console.log(
              "Données enregistrées dans la base de données avec l'ID :",
              this.lastID
            );
          }
        });
      }
    }
  });
}

// Création du serveur TCP pour ESP32
const server = net.createServer((socket) => {
  console.log("ESP32 connecté");

  socket.on("data", (data) => {
    saveData(data);
  });

  socket.on("end", () => {
    console.log("ESP32 déconnecté");
  });
});

// Démarrer les serveurs
server.listen(ports, () => {
  console.log("Serveur TCP en écoute sur le port " + ports);
});

http.listen(port, () => {
  console.log("Serveur HTTP en écoute sur le port " + port);
});
