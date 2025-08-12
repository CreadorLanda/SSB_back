const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Despesa = sequelize.define('Despesa', {
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('fixa', 'variavel'),
    allowNull: false
  },
  dataDespesa: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});



const Salao = require("./salao")

Salao.hasMany(Despesa);
Despesa.belongsTo(Salao);


module.exports = Despesa;
