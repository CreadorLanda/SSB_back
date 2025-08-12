const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'railway', // DB_NAME
  'root',    // DB_USER
  'ODxfCFYvVMhfbXFUlyrOIXdSeRdkKbjS', // DB_PASSWORD
  {
    host: 'maglev.proxy.rlwy.net',
    port: 27439,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;
