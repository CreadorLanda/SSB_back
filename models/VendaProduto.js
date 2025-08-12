const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produto = require('./Produtos');
const Venda = require('./vendas');

const VendaProduto = sequelize.define('VendaProduto', {
 
});

// Relacionamentos
Produto.hasMany(VendaProduto);
Venda.hasMany(VendaProduto);
VendaProduto.belongsTo(Produto);
VendaProduto.belongsTo(Venda);




const Salao = require("./salao")

Salao.hasMany(VendaProduto);
VendaProduto.belongsTo(Salao);



module.exports = VendaProduto;
