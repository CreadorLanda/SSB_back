// No arquivo MetodoPagamento.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Venda = require('./vendas');

const MetodoPagamento = sequelize.define('MetodoPagamento', {
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detalhes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});



const Salao = require("./salao")

Salao.hasMany(MetodoPagamento);
MetodoPagamento.belongsTo(Salao);



module.exports = MetodoPagamento;
