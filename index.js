require('dotenv').config();
const sequelize = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 9000;

// Inicializa conexão com o banco e sobe o servidor (para uso local/VPS)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados com sucesso.');
    await sequelize.sync({ force: false });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  }
})();
