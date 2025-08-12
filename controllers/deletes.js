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





router.delete('/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const despesa = await Despesa.findByPk(id);
    if (!despesa) {
      return res.status(404).json({ erro: 'Despesa não encontrada' });
    }

    await despesa.destroy();
    res.json({ mensagem: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao excluir despesa' });
  }
});



router.delete('/servicos/:id', async (req, res) => {
  const id = req.params.id
  try {
    const servico = await Servico.findByPk(id)
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' })

    await servico.update({ ativo: false })
    res.json({ mensagem: 'Serviço desativado com sucesso.' })
  } catch (err) {
    console.error('Erro ao excluir serviço:', err)
    res.status(500).json({ erro: 'Falha ao excluir serviço.' })
  }
})

// Exclui um usuário
router.delete('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    await usuario.destroy();

    res.json({ mensagem: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao excluir usuário' });
  }
});


module.exports = router;
