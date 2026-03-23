const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "biblioteca_senac"
});

db.connect((erro) => {
  if (erro) {
    console.log("Erro ao conectar no banco:", erro);
  } else {
    console.log("Conectado ao MySQL com sucesso!");
  }
});

module.exports = db;