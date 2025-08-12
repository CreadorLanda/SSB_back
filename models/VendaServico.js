const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VendaServico = sequelize.define('VendaServico', {
 
});

const Servico = require('./servicos');
const Venda = require("./vendas")


Servico.hasMany(VendaServico);
Venda.hasMany(VendaServico);
VendaServico.belongsTo(Servico);
VendaServico.belongsTo(Venda);




const Salao = require("./salao")

Salao.hasMany(VendaServico);
VendaServico.belongsTo(Salao);



module.exports = VendaServico;
