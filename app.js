require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

// Initialize express application
const app = express();

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://31.97.115.4:8080'],
    credentials: true,
  })
);

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Sessions configuration
app.use(
  session({
    secret: 'seuSegredoAqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// Basic health route
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Ensure models are registered
require('./models/usuarios');
require('./models/clientes');
require('./models/servicos');
require('./models/vendas');
require('./models/VendaServico');
require('./models/despesa');
require('./models/agendamento');
require('./models/agendaServico');
require('./models/agendaProdutos');
require('./models/metodopagamento');
require('./models/Produtos');
require('./models/VendaProduto');
require('./models/salao');
require('./models/CategoriaServico');
require('./models/Funcionarios');

// Controllers and routes
const UsuarioController = require('./controllers/usuarioController');
app.use('/', UsuarioController);

const GestaoController = require('./controllers/usuarioController');
app.use('/', GestaoController);

const clientesController = require('./controllers/clientesController');
app.use('/', clientesController);

app.use(express.json());

// Session helper routes
app.get('/sessao', (req, res) => {
  if (req.session.usuario) {
    res.json({ logado: true, usuario: req.session.usuario });
  } else {
    res.json({ logado: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err);
      return res.status(500).json({ erro: 'Erro ao sair' });
    }
    res.clearCookie('connect.sid');
    res.json({ mensagem: 'Sessão encerrada com sucesso.' });
  });
});

module.exports = app;


