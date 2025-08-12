const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  dataNascimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  localidade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dataAgendamento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});



const Salao = require("./salao")

Salao.hasMany(Cliente);
Cliente.belongsTo(Salao);


module.exports = Cliente;
