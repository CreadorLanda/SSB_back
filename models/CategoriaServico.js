const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Servico = require("./servicos");
const Salao = require("./salao");

const CategoriaServico = sequelize.define('CategoriaServico', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

CategoriaServico.hasMany(Servico);
Servico.belongsTo(CategoriaServico);

Salao.hasMany(CategoriaServico);
CategoriaServico.belongsTo(Salao);

module.exports = CategoriaServico;
