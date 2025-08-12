// models/funcionarios.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Salao = require('./salao'); // Caso você tenha esse modelo
const VendaServico = require("./VendaServico");
const AgendamentoServico = require("./agendaServico");

const Funcionario = sequelize.define('Funcionario', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  funcao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Relacionamento com Salao (Se necessário)
Salao.hasMany(Funcionario);
Funcionario.belongsTo(Salao);

Funcionario.hasMany(VendaServico)
VendaServico.belongsTo(Funcionario);



Funcionario.hasMany(AgendamentoServico)
AgendamentoServico.belongsTo(Funcionario);

module.exports = Funcionario;
