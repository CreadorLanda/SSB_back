const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Clentes = require("./clientes");
const Cliente = require('./clientes');
const Venda = require('./vendas');

const Servico = sequelize.define('Servico', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});


Venda.hasMany(Cliente);
Cliente.belongsTo(Venda);


const Salao = require("./salao")

Salao.hasMany(Servico);
Servico.belongsTo(Salao);


module.exports = Servico;
