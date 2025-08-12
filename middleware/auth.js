const jwt = require('jsonwebtoken');
const JWT_SECRET = 'berna12890i'; // ⚠️ Use .env em produção

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ erro: 'Token mal formatado' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Coloca o usuário no req para uso nas rotas
    req.usuario = {
      id: payload.id,
      nome: payload.nome,
      email: payload.email,
      funcao: payload.funcao
    };

    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};
