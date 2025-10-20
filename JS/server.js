const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Conexão com MariaDB
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1215181931', // coloca sua senha
  database: 'lista_compras'
});

// --- Rotas ---

const bcrypt = require('bcryptjs');

// --- Cadastro ---
app.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;

  // Verifica se o email já existe
  conn.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro no servidor' });
    if (results.length > 0) return res.status(400).json({ erro: 'Email já cadastrado' });

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere o usuário
    conn.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaHash],
      (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao cadastrar' });

        // Aqui retornamos o ID junto
        res.json({ msg: 'Usuário cadastrado com sucesso!', usuario_id: result.insertId });
      }
    );
  });
});

// --- Login ---
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  conn.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro no servidor' });
    if (results.length === 0) return res.status(400).json({ erro: 'Usuário não encontrado' });

    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) return res.status(401).json({ erro: 'Senha incorreta' });

    res.json({ msg: 'Login bem-sucedido', usuario_id: usuario.id });
  });
});


// Pegar todos os itens
app.get('/itens/:usuario_id', (req, res) => {
  const { usuario_id } = req.params;
  conn.query('SELECT * FROM itens WHERE usuario_id = ?', [usuario_id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});


// Adicionar item
app.post('/itens', (req, res) => {
  const { nome, quantidade, preco, usuario_id } = req.body;
  conn.query(
    'INSERT INTO itens (nome, quantidade, preco, usuario_id) VALUES (?, ?, ?, ?)',
    [nome, quantidade, preco, usuario_id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, nome, quantidade, preco, comprado: false });
    }
  );
});


// Atualizar item (quantidade, preço ou comprado)
app.put('/itens/:id', (req, res) => {
  const { id } = req.params;
  const { quantidade, preco, comprado } = req.body;
  conn.query(
    'UPDATE itens SET quantidade = ?, preco = ?, comprado = ? WHERE id = ?',
    [quantidade, preco, comprado, id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ success: true });
    }
  );
});

// Deletar item
app.delete('/itens/:id', (req, res) => {
  const { id } = req.params;
  conn.query('DELETE FROM itens WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

// Iniciar servidor
app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
