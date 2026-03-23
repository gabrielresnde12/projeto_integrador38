CREATE DATABASE biblioteca_senac;

USE biblioteca_senac;

CREATE TABLE usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100),
email VARCHAR(100),
senha VARCHAR(255),
perfil VARCHAR(20)
);

CREATE TABLE categorias (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100)
);

CREATE TABLE livros (
id INT AUTO_INCREMENT PRIMARY KEY,
titulo VARCHAR(200),
autor VARCHAR(100),
categoria_id INT,
quantidade INT,
FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE emprestimos (
id INT AUTO_INCREMENT PRIMARY KEY,
usuario_id INT,
livro_id INT,
data_emprestimo DATE,
data_devolucao DATE,
status VARCHAR(20),
FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
FOREIGN KEY (livro_id) REFERENCES livros(id)
);

CREATE TABLE reservas (
id INT AUTO_INCREMENT PRIMARY KEY,
usuario_id INT,
livro_id INT,
data_reserva DATE,
status VARCHAR(20),
FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
FOREIGN KEY (livro_id) REFERENCES livros(id)
);