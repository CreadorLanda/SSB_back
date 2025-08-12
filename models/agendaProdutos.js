const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AgendamentoProduto = sequelize.define('AgendamentoProduto', {
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Relacionamentos
const Agendamento = require('./agendamento');
const Produto = require('./Produtos');

Agendamento.hasMany(AgendamentoProduto);
AgendamentoProduto.belongsTo(Agendamento);

Produto.hasMany(AgendamentoProduto);
AgendamentoProduto.belongsTo(Produto);



const Salao = require("./salao")

Salao.hasMany(AgendamentoProduto);
AgendamentoProduto.belongsTo(Salao);


module.exports = AgendamentoProduto;
