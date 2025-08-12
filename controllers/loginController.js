const express = require('express');
const router = express.Router();
const Usuario  = require('../models/usuarios');
const Despesa = require("../models/despesa")
const Venda = require("../models/vendas");
const VendaServico = require("../models/VendaServico");
const Clientes  = require('../models/clientes');

const Servico = require("../models/servicos")
const bcrypt = require('bcrypt');




 

const jwt = require('jsonwebtoken');


const JWT_SECRET = 'berna12890i'; // substitua por algo seguro



const verificarToken = require("../middleware/auth");

const auth = require("../middleware/auth");







// POST /login - Faz login e retorna token JWT
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    if (usuario.ativo != 1) { // com != (não estritamente igual)
      return res.status(403).json({ erro: 'Hmm... Parece que sua conta está desativada. Contate um responsável..' });
    }
    
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // ✅ Gera token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao
      },
      JWT_SECRET,
      { expiresIn: '6h' }
    );

    // ✅ Retorna token + dados do usuário
    res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao
      }
    });

  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});




module.exports = router;
