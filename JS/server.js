const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // ler JSON do front

// Conexão com MariaDB
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1215181931', // coloca sua senha
  database: 'lista_compras'
});

// --- Rotas ---

// Pegar todos os itens
app.get('/itens', (req, res) => {
  conn.query('SELECT * FROM itens', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Adicionar item
app.post('/itens', (req, res) => {
  const { nome, quantidade, preco } = req.body;
  conn.query(
    'INSERT INTO itens (nome, quantidade, preco) VALUES (?, ?, ?)',
    [nome, quantidade, preco],
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
