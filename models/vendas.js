const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MetodoPagamento = require("./metodopagamento")
const Agendamento = require("./agendamento")

const Usuarios  = require("./usuarios")

const Venda = sequelize.define('Venda', {
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dataVenda: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  valorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

const Cliente = require('./clientes');



  Usuarios.hasMany(Venda);
  Venda.belongsTo(Usuarios);


 MetodoPagamento.hasMany(Venda);
  Venda.belongsTo(MetodoPagamento)

  
const Salao = require("./salao")

Salao.hasMany(Venda);
Venda.belongsTo(Salao);


Agendamento.hasMany(Venda);
Venda.belongsTo(Agendamento);

module.exports = Venda;
