const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Salao = sequelize.define('Salao', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pendente', 'ativo', 'bloqueado'),
    allowNull: false,
    defaultValue: 'pendente'
  }
});

module.exports = Salao;
