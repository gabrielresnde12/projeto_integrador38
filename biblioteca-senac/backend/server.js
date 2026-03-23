const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "Sistema Biblioteca SENAC funcionando"
  });
});

// ===============================
// LIVROS
// ===============================

app.get("/livros", (req, res) => {
  const sql = "SELECT * FROM livros";

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO BUSCAR LIVROS:", erro);
      return res.status(500).json({
        erro: "Erro ao buscar livros"
      });
    }

    res.json(resultado);
  });
});

app.post("/livros", (req, res) => {
  const {
    titulo,
    autor,
    isbn,
    ano_publicacao,
    quantidade_total,
    quantidade_disponivel,
    localizacao,
    status
  } = req.body;

  if (!titulo || !autor || quantidade_total == null) {
    return res.status(400).json({
      erro: "Campos obrigatórios faltando"
    });
  }

  const sql = `
    INSERT INTO livros
    (titulo, autor, isbn, ano_publicacao, quantidade_total, quantidade_disponivel, localizacao, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      titulo,
      autor,
      isbn || null,
      ano_publicacao || null,
      quantidade_total,
      quantidade_disponivel ?? quantidade_total,
      localizacao || null,
      status || "disponivel"
    ],
    (erro, resultado) => {
      if (erro) {
        console.log("ERRO MYSQL:", erro);
        return res.status(500).json({
          erro: "Erro no banco",
          detalhes: erro.message
        });
      }

      res.status(201).json({
        mensagem: "Livro cadastrado com sucesso",
        id: resultado.insertId
      });
    }
  );
});

app.put("/livros/:id", (req, res) => {
  const id = req.params.id;

  const {
    titulo,
    autor,
    isbn,
    ano_publicacao,
    quantidade_total,
    quantidade_disponivel,
    localizacao,
    status
  } = req.body;

  if (!titulo || !autor || quantidade_total == null || quantidade_disponivel == null) {
    return res.status(400).json({
      erro: "titulo, autor, quantidade_total e quantidade_disponivel são obrigatórios"
    });
  }

  const sql = `
    UPDATE livros
    SET titulo = ?, autor = ?, isbn = ?, ano_publicacao = ?, quantidade_total = ?,
        quantidade_disponivel = ?, localizacao = ?, status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      titulo,
      autor,
      isbn || null,
      ano_publicacao || null,
      quantidade_total,
      quantidade_disponivel,
      localizacao || null,
      status || "disponivel",
      id
    ],
    (erro) => {
      if (erro) {
        console.log("ERRO AO EDITAR LIVRO:", erro);
        return res.status(500).json({
          erro: "Erro ao editar livro",
          detalhes: erro.message
        });
      }

      res.json({
        mensagem: "Livro atualizado com sucesso"
      });
    }
  );
});

// NÃO PODE EXCLUIR LIVRO EMPRESTADO
app.delete("/livros/:id", (req, res) => {
  const id = req.params.id;

  const buscarLivro = "SELECT * FROM livros WHERE id = ?";

  db.query(buscarLivro, [id], (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO BUSCAR LIVRO:", erro);
      return res.status(500).json({
        erro: "Erro ao buscar livro"
      });
    }

    if (resultado.length === 0) {
      return res.status(404).json({
        erro: "Livro não encontrado"
      });
    }

    const verificarEmprestimo = `
      SELECT * FROM emprestimos
      WHERE livro_id = ? AND status = 'emprestado'
    `;

    db.query(verificarEmprestimo, [id], (erro2, resultado2) => {
      if (erro2) {
        console.log("ERRO AO VERIFICAR EMPRÉSTIMO:", erro2);
        return res.status(500).json({
          erro: "Erro ao verificar empréstimos do livro"
        });
      }

      if (resultado2.length > 0) {
        return res.status(400).json({
          erro: "Não é possível excluir este livro porque ele está emprestado"
        });
      }

      const excluirLivro = "DELETE FROM livros WHERE id = ?";

      db.query(excluirLivro, [id], (erro3) => {
        if (erro3) {
          console.log("ERRO AO EXCLUIR LIVRO:", erro3);
          return res.status(500).json({
            erro: "Erro ao excluir livro",
            detalhes: erro3.message
          });
        }

        res.json({
          mensagem: "Livro excluído com sucesso"
        });
      });
    });
  });
});

// ===============================
// USUÁRIOS
// ===============================

app.get("/usuarios", (req, res) => {
  const sql = "SELECT id, nome, email, perfil FROM usuarios";

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO BUSCAR USUÁRIOS:", erro);
      return res.status(500).json({
        erro: "Erro ao buscar usuários"
      });
    }

    res.json(resultado);
  });
});

app.post("/usuarios", (req, res) => {
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({
      erro: "Todos os campos são obrigatórios"
    });
  }

  const verificar = "SELECT * FROM usuarios WHERE email = ?";

  db.query(verificar, [email], (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO VERIFICAR E-MAIL:", erro);
      return res.status(500).json({
        erro: "Erro ao verificar e-mail"
      });
    }

    if (resultado.length > 0) {
      return res.status(400).json({
        erro: "E-mail já cadastrado"
      });
    }

    const sql = `
      INSERT INTO usuarios (nome, email, senha, perfil)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [nome, email, senha, perfil], (erro2, resultado2) => {
      if (erro2) {
        console.log("ERRO AO CADASTRAR USUÁRIO:", erro2);
        return res.status(500).json({
          erro: "Erro ao cadastrar usuário"
        });
      }

      res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso",
        id: resultado2.insertId
      });
    });
  });
});

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      erro: "Email e senha são obrigatórios"
    });
  }

  const sql = "SELECT * FROM usuarios WHERE email = ? AND senha = ?";

  db.query(sql, [email, senha], (erro, resultado) => {
    if (erro) {
      console.log("ERRO NO LOGIN:", erro);
      return res.status(500).json({
        erro: "Erro ao fazer login"
      });
    }

    if (resultado.length === 0) {
      return res.status(401).json({
        erro: "E-mail ou senha inválidos"
      });
    }

    const usuario = resultado[0];

    res.json({
      mensagem: "Login realizado com sucesso",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  });
});

// ===============================
// EMPRÉSTIMOS
// ===============================

app.get("/emprestimos", (req, res) => {
  const sql = `
    SELECT e.*, u.nome AS usuario_nome, l.titulo AS livro_titulo
    FROM emprestimos e
    JOIN usuarios u ON e.usuario_id = u.id
    JOIN livros l ON e.livro_id = l.id
  `;

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO BUSCAR EMPRÉSTIMOS:", erro);
      return res.status(500).json({
        erro: "Erro ao buscar empréstimos"
      });
    }

    res.json(resultado);
  });
});

// EMPRÉSTIMO COM PRAZO E BLOQUEIO POR ATRASO
app.post("/emprestimos", (req, res) => {
  const { usuario_id, livro_id } = req.body;

  if (!usuario_id || !livro_id) {
    return res.status(400).json({
      erro: "usuario_id e livro_id são obrigatórios"
    });
  }

  // 1. Verifica se o usuário existe
  const buscarUsuario = "SELECT * FROM usuarios WHERE id = ?";

  db.query(buscarUsuario, [usuario_id], (erroUsuario, usuarios) => {
    if (erroUsuario) {
      console.log("ERRO AO BUSCAR USUÁRIO:", erroUsuario);
      return res.status(500).json({
        erro: "Erro ao buscar usuário"
      });
    }

    if (usuarios.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado"
      });
    }

    // 2. Verifica atraso
    const verificarAtraso = `
      SELECT * FROM emprestimos
      WHERE usuario_id = ?
      AND status = 'emprestado'
      AND data_prevista < NOW()
    `;

    db.query(verificarAtraso, [usuario_id], (erroAtraso, atrasos) => {
      if (erroAtraso) {
        console.log("ERRO AO VERIFICAR ATRASO:", erroAtraso);
        return res.status(500).json({
          erro: "Erro ao verificar atrasos"
        });
      }

      if (atrasos.length > 0) {
        return res.status(400).json({
          erro: "Usuário com livro atrasado! Devolva antes de pegar outro."
        });
      }

      // 3. Verifica o livro
      const buscarLivro = "SELECT * FROM livros WHERE id = ?";

      db.query(buscarLivro, [livro_id], (erroLivro, livros) => {
        if (erroLivro) {
          console.log("ERRO AO BUSCAR LIVRO:", erroLivro);
          return res.status(500).json({
            erro: "Erro no banco"
          });
        }

        if (livros.length === 0) {
          return res.status(404).json({
            erro: "Livro não encontrado"
          });
        }

        const livro = livros[0];

        if (livro.quantidade_disponivel <= 0) {
          return res.status(400).json({
            erro: "Livro indisponível"
          });
        }

        // 4. Cria empréstimo com prazo de 7 dias
        const sql = `
          INSERT INTO emprestimos
          (usuario_id, livro_id, status, data_emprestimo, data_prevista)
          VALUES (?, ?, 'emprestado', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))
        `;

        db.query(sql, [usuario_id, livro_id], (erroEmprestimo) => {
          if (erroEmprestimo) {
            console.log("ERRO AO EMPRESTAR:", erroEmprestimo);
            return res.status(500).json({
              erro: "Erro ao emprestar",
              detalhes: erroEmprestimo.message
            });
          }

          // 5. Atualiza estoque
          const atualizar = `
            UPDATE livros
            SET quantidade_disponivel = quantidade_disponivel - 1
            WHERE id = ?
          `;

          db.query(atualizar, [livro_id], (erroAtualizar) => {
            if (erroAtualizar) {
              console.log("ERRO AO ATUALIZAR QUANTIDADE:", erroAtualizar);
              return res.status(500).json({
                erro: "Erro ao atualizar quantidade do livro"
              });
            }

            res.json({
              mensagem: "Empréstimo realizado com sucesso. Prazo de devolução: 7 dias."
            });
          });
        });
      });
    });
  });
});

// DEVOLUÇÃO COM REGISTRO DE DATA REAL
app.put("/devolucoes/:id", (req, res) => {
  const id = req.params.id;

  const sqlBuscar = "SELECT * FROM emprestimos WHERE id = ?";

  db.query(sqlBuscar, [id], (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO BUSCAR EMPRÉSTIMO:", erro);
      return res.status(500).json({
        erro: "Erro no banco"
      });
    }

    if (resultado.length === 0) {
      return res.status(404).json({
        erro: "Empréstimo não encontrado"
      });
    }

    const emprestimo = resultado[0];

    if (emprestimo.status === "devolvido") {
      return res.status(400).json({
        erro: "Já devolvido"
      });
    }

    const atualizarEmprestimo = `
      UPDATE emprestimos
      SET status = 'devolvido',
          data_devolucao = NOW()
      WHERE id = ?
    `;

    db.query(atualizarEmprestimo, [id], (erro2) => {
      if (erro2) {
        console.log("ERRO AO ATUALIZAR EMPRÉSTIMO:", erro2);
        return res.status(500).json({
          erro: "Erro ao atualizar empréstimo"
        });
      }

      const atualizarLivro = `
        UPDATE livros
        SET quantidade_disponivel = quantidade_disponivel + 1
        WHERE id = ?
      `;

      db.query(atualizarLivro, [emprestimo.livro_id], (erro3) => {
        if (erro3) {
          console.log("ERRO AO ATUALIZAR LIVRO:", erro3);
          return res.status(500).json({
            erro: "Erro ao atualizar quantidade do livro"
          });
        }

        res.json({
          mensagem: "Livro devolvido com sucesso"
        });
      });
    });
  });
});

// RELATÓRIO DE ATRASOS
app.get("/emprestimos/atrasados", (req, res) => {
  const sql = `
    SELECT e.*, u.nome AS usuario_nome, l.titulo AS livro_titulo
    FROM emprestimos e
    JOIN usuarios u ON e.usuario_id = u.id
    JOIN livros l ON e.livro_id = l.id
    WHERE e.status = 'emprestado'
      AND e.data_prevista < NOW()
    ORDER BY e.data_prevista ASC
  `;

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.log("ERRO AO BUSCAR ATRASOS:", erro);
      return res.status(500).json({
        erro: "Erro ao buscar empréstimos atrasados"
      });
    }

    res.json(resultado);
  });
});

// ===============================
// RELATÓRIOS
// ===============================

app.get("/relatorios/livros-mais-emprestados", (req, res) => {
  const sql = `
    SELECT 
      l.id,
      l.titulo,
      l.autor,
      COUNT(e.id) AS total_emprestimos
    FROM livros l
    LEFT JOIN emprestimos e ON l.id = e.livro_id
    GROUP BY l.id, l.titulo, l.autor
    ORDER BY total_emprestimos DESC, l.titulo ASC
  `;

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.log("ERRO RELATÓRIO LIVROS:", erro);
      return res.status(500).json({
        erro: "Erro ao gerar relatório de livros"
      });
    }

    res.json(resultado);
  });
});

app.get("/relatorios/usuarios-ativos", (req, res) => {
  const sql = `
    SELECT
      u.id,
      u.nome,
      u.email,
      COUNT(e.id) AS emprestimos_ativos
    FROM usuarios u
    LEFT JOIN emprestimos e 
      ON u.id = e.usuario_id AND e.status = 'emprestado'
    GROUP BY u.id, u.nome, u.email
    ORDER BY emprestimos_ativos DESC, u.nome ASC
  `;

  db.query(sql, (erro, resultado) => {
    if (erro) {
      console.log("ERRO RELATÓRIO USUÁRIOS:", erro);
      return res.status(500).json({
        erro: "Erro ao gerar relatório de usuários"
      });
    }

    res.json(resultado);
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});