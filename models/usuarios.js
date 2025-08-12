const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  funcao: {
  type: DataTypes.ENUM('super_admin', 'admin', 'recepcionista', 'profissional'),
  defaultValue: 'recepcionista',
  allowNull: false
}
,
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});


const Salao = require("./salao")

Salao.hasMany(Usuario);
Usuario.belongsTo(Salao);

module.exports = Usuario;
