const express = require('express');
const router = express.Router();
const Usuario  = require('../models/usuarios');
const Despesa = require("../models/despesa")
const Venda = require("../models/vendas");
const VendaServico = require("../models/VendaServico");

const Produtos = require("../models/Produtos")

const VendaProduto = require("../models/VendaProduto");

const Servico = require("../models/servicos")
const bcrypt = require('bcrypt');

Salao = require("../models/salao");

const verificarToken = require("../middleware/auth");


const auth = require("../middleware/auth");






// GET /usuarios/existe-superadmin
router.get('/usuarios/existe-superadmin', async (req, res) => {
  try {
    const superAdminExiste = await Usuario.findOne({ where: { funcao: 'super_admin' } });
    res.json({ superAdminExiste: !!superAdminExiste });
  } catch (error) {
    console.error('Erro ao verificar super_admin:', error);
    res.status(500).json({ erro: 'Erro interno ao verificar super_admin.' });
  }
});











 

const jwt = require('jsonwebtoken');
const Salao = require('../models/salao');


const JWT_SECRET = 'berna12890i'; // substitua por algo seguro





// POST /saloes - Cadastra salão + dono admin
router.post('/saloes', async (req, res) => {
  const { nomeSalao, endereco, telefone, dono } = req.body;

  try {
    // 1. Cria o salão
    const novoSalao = await Salao.create({
      nome: nomeSalao,
      endereco,
      telefone
    });

    // 2. Cria o dono associado ao salão (função admin)
    const senhaCriptografada = await bcrypt.hash(dono.senha, 10);
    const novoDono = await Usuario.create({
      nome: dono.nome,
      email: dono.email,
      senha: senhaCriptografada,
      funcao: 'admin',
      ativo: 1,
      SalaoId: novoSalao.id
    });

    res.status(201).json({
      mensagem: 'Salão e dono cadastrados com sucesso!',
      salao: novoSalao,
      dono: {
        id: novoDono.id,
        nome: novoDono.nome,
        email: novoDono.email
      }
    });
  } catch (erro) {
    console.error('Erro ao cadastrar salão e dono:', erro);
    res.status(500).json({ erro: 'Erro ao cadastrar salão e dono.' });
  }
});




module.exports = router;
