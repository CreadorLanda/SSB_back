const serverless = require('serverless-http');
const sequelize = require('../config/database');
const app = require('../app');

let isDatabaseReady = false;

async function ensureDatabaseReady() {
  if (isDatabaseReady) return;
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    isDatabaseReady = true;
  } catch (error) {
    console.error('Erro ao inicializar o banco na função serverless:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  await ensureDatabaseReady();
  const handler = serverless(app);
  return handler(req, res);
};


