const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produto = sequelize.define('Produto', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  precoCompra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precoVenda: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

const Salao = require("./salao");

Salao.hasMany(Produto);
Produto.belongsTo(Salao);

module.exports = Produto;
