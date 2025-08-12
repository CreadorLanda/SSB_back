const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./clientes');
const MetodoPagamento = require("./metodopagamento");


const Agendamento = sequelize.define('Agendamento', {
  dataHora: {
    type: DataTypes.DATE,
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  finalizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

Cliente.hasMany(Agendamento);
Agendamento.belongsTo(Cliente);



 MetodoPagamento.hasMany(Agendamento);
 Agendamento.belongsTo(MetodoPagamento)


const Salao = require("./salao")

Salao.hasMany(Agendamento);
Agendamento.belongsTo(Salao);

 

module.exports = Agendamento;
