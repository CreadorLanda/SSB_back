const express = require('express');
const router = express.Router();
const Usuario  = require('../models/usuarios');
const Despesa = require("../models/despesa")
const Venda = require("../models/vendas");
const VendaServico = require("../models/VendaServico");

const Produtos = require("../models/Produtos")

const VendaProduto = require("../models/VendaProduto");

const Servico = require("../models/servicos")
const bcrypt = require('bcrypt');

const auth = require("../middleware/auth");
const Salao = require('../models/salao');

const verificarToken = require("../middleware/auth");



const salao = require("../models/salao");


const Funcionario = require("../models/Funcionarios")

const CategoriaServico = require("../models/CategoriaServico");

router.get('/todos-saloes', async (req, res) => {
  try {
    const saloes = await salao.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json({ saloes })
  } catch (error) {
    console.error('Erro ao buscar salões:', error)
    res.status(500).json({ erro: 'Erro interno ao buscar salões' })
  }
})




// POST /saloes - Cadastra salão + dono admin
router.post('/saloes', async (req, res) => {
  const { nomeSalao, endereco, telefone, dono } = req.body;

  try {
    // 1. Cria o salão com status padrão 'pendente'
    const novoSalao = await salao.create({
      nome: nomeSalao,
      endereco,
      telefone,
      status: 'pendente'  // adiciona o status aqui
    });

    // 2. Cria o dono associado ao salão (função admin)
    const senhaCriptografada = await bcrypt.hash(dono.senha, 10);
    const novoDono = await Usuario.create({
      nome: dono.nome,
      email: dono.email,
      senha: senhaCriptografada,
      funcao: 'admin',
      ativo: 1,
      SalaoId: novoSalao.id
    });

    res.status(201).json({
      mensagem: 'Salão e dono cadastrados com sucesso!',
      salao: novoSalao,
      dono: {
        id: novoDono.id,
        nome: novoDono.nome,
        email: novoDono.email
      }
    });
  } catch (erro) {
    console.error('Erro ao cadastrar salão e dono:', erro);
    res.status(500).json({ erro: 'Erro ao cadastrar salão e dono.' });
  }
});






router.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, funcao } = req.body;

    // Verifica se o email já está cadastrado
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ erro: 'Email já cadastrado.' });
    }

    // Se a função for 'admin', só permite se ainda não houver nenhum
    if (funcao === 'admin') {
      const jaExisteAdmin = await Usuario.findOne({ where: { funcao: 'admin' } });
      if (jaExisteAdmin) {
        return res.status(403).json({ erro: 'Cadastro de administrador não permitido.' });
      }
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Cria novo usuário
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      funcao
    });

    // Gera token JWT
    const token = jwt.sign(
      {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        funcao: novoUsuario.funcao
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      token,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        funcao: novoUsuario.funcao
      }
    });

  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
  }
});




// GET /usuarios/existe-superadmin
router.get('/usuarios/existe-superadmin', async (req, res) => {
  try {
    const superAdminExiste = await Usuario.findOne({ where: { funcao: 'super_admin' } });
    res.json({ superAdminExiste: !!superAdminExiste });
  } catch (error) {
    console.error('Erro ao verificar super_admin:', error);
    res.status(500).json({ erro: 'Erro interno ao verificar super_admin.' });
  }
});











 

const jwt = require('jsonwebtoken');


const JWT_SECRET = 'berna12890i'; // substitua por algo seguro



// POST /login - Faz login e retorna token JWT
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    if (usuario.ativo != 1) { // com != (não estritamente igual)
      return res.status(403).json({ erro: 'Hmm... Parece que sua conta está desativada. Contate um responsável..' });
    }
    
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // ✅ Gera token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao
      },
      JWT_SECRET,
      { expiresIn: '6h' }
    );

    // ✅ Retorna token + dados do usuário
    res.json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: usuario.funcao
      }
    });

  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
});




router.delete('/despesas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const despesa = await Despesa.findByPk(id);
    if (!despesa) {
      return res.status(404).json({ erro: 'Despesa não encontrada' });
    }

    await despesa.destroy();
    res.json({ mensagem: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao excluir despesa' });
  }
});




router.get('/despesas', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const SalaoId = usuario.SalaoId;

    const despesas = await Despesa.findAll({
      where: { SalaoId },
      order: [['dataDespesa', 'DESC']]
    });

    res.json(despesas);
  } catch (err) {
    console.error('Erro ao listar despesas:', err);
    res.status(500).json({ erro: 'Erro ao listar despesas.' });
  }
});



// GET /despesas/:id - busca uma despesa específica
router.get('/despesas/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const despesa = await Despesa.findByPk(id);
    if (!despesa) {
      return res.status(404).json({ erro: 'Despesa não encontrada.' });
    }
    res.json(despesa);
  } catch (err) {
    console.error('Erro ao buscar despesa:', err);
    res.status(500).json({ erro: 'Erro ao buscar despesa.' });
  }
});




router.post('/cadastrar-despesas', auth, async (req, res) => {
  try {
    const { descricao, valor, dataDespesa, tipo, observacoes } = req.body;

    if (!descricao || !valor || !dataDespesa || !tipo) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes.' });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const SalaoId = usuario.SalaoId;
    const UsuarioId = usuario.id;

    const novaDespesa = await Despesa.create({
      descricao,
      valor,
      dataDespesa,
      tipo,
      observacoes,
      SalaoId,
      UsuarioId
    });

    res.status(201).json(novaDespesa);
  } catch (error) {
    console.error('Erro ao cadastrar despesa:', error);
    res.status(500).json({ erro: 'Erro ao cadastrar despesa.' });
  }
});


const { Op } = require('sequelize');

router.get('/relatorio-servico', auth, async (req, res) => {
  try {
    let { servicoIds, produtoIds, periodo, incluirDespesas } = req.query;

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const SalaoId = usuario.SalaoId;

    const parseIds = (ids) => {
      if (!ids) return [];
      if (Array.isArray(ids)) return ids.map(Number).filter(Boolean);
      return [Number(ids)].filter(Boolean);
    };
    servicoIds = parseIds(servicoIds);
    produtoIds = parseIds(produtoIds);
    incluirDespesas = incluirDespesas === 'true';

    if ((!servicoIds.length && !produtoIds.length) || !periodo) {
      return res.status(400).json({ message: 'Serviço(s), produto(s) ou período não fornecido(s)' });
    }

    const endDate = new Date();
    const startDate = new Date(endDate);

    switch (periodo) {
      case 'dia': break;
      case 'semana': startDate.setDate(endDate.getDate() - 7); break;
      case 'mes': startDate.setMonth(endDate.getMonth() - 1); break;
      case 'trimestre': startDate.setMonth(endDate.getMonth() - 3); break;
      case 'ano': startDate.setFullYear(endDate.getFullYear() - 1); break;
      default: return res.status(400).json({ message: 'Período inválido' });
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const vendas = await Venda.findAll({
      where: {
        SalaoId,
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['id'],
    });

    const vendaIds = vendas.map(v => v.id);

    if (!vendaIds.length) {
      return res.json({
        dataInicio: startDate.toISOString().slice(0, 10),
        dataFim: endDate.toISOString().slice(0, 10),
        totalVendas: 0,
        totalServicosVendidos: 0,
        totalProdutosVendidos: 0,
        detalhesServicos: [],
        detalhesProdutos: [],
        totalVendido: 0,
        totalDespesas: 0,
        saldo: 0,
      });
    }

    const servicos = servicoIds.length
      ? await Servico.findAll({ where: { id: { [Op.in]: servicoIds } } })
      : [];
    const produtos = produtoIds.length
      ? await Produtos.findAll({ where: { id: { [Op.in]: produtoIds } } })
      : [];

    const precosServicos = {};
    const nomesServicos = {};
    servicos.forEach(s => {
      precosServicos[s.id] = parseFloat(s.preco);
      nomesServicos[s.id] = s.nome;
    });

    const precosProdutos = {};
    const nomesProdutos = {};
    produtos.forEach(p => {
      precosProdutos[p.id] = parseFloat(p.precoVenda); // <- ALTERADO AQUI
      nomesProdutos[p.id] = p.nome;
    });

    const vendasServicos = servicoIds.length
      ? await VendaServico.findAll({
          where: {
            VendaId: { [Op.in]: vendaIds },
            ServicoId: { [Op.in]: servicoIds },
          },
        })
      : [];

    const totaisPorServico = {};
    const quantidadesPorServico = {};
    let totalVendidoServicos = 0;
    let totalServicosVendidos = 0;

    vendasServicos.forEach(vs => {
      const id = vs.ServicoId;
      const preco = precosServicos[id] || 0;
      totaisPorServico[id] = (totaisPorServico[id] || 0) + preco;
      quantidadesPorServico[id] = (quantidadesPorServico[id] || 0) + 1;
      totalVendidoServicos += preco;
      totalServicosVendidos += 1;
    });

    const detalhesServicos = Object.entries(totaisPorServico).map(([id, total]) => {
      const quantidade = quantidadesPorServico[id];
      return {
        id: Number(id),
        nome: nomesServicos[id],
        quantidade,
        total,
        media: quantidade ? total / quantidade : 0,
      };
    });

    const vendasProdutos = produtoIds.length
      ? await VendaProduto.findAll({
          where: {
            VendaId: { [Op.in]: vendaIds },
            ProdutoId: { [Op.in]: produtoIds },
          },
        })
      : [];

    const totaisPorProduto = {};
    const quantidadesPorProduto = {};
    let totalVendidoProdutos = 0;
    let totalProdutosVendidos = 0;

    vendasProdutos.forEach(vp => {
      const id = vp.ProdutoId;
      const preco = precosProdutos[id] || 0;
      totaisPorProduto[id] = (totaisPorProduto[id] || 0) + preco;
      quantidadesPorProduto[id] = (quantidadesPorProduto[id] || 0) + 1;
      totalVendidoProdutos += preco;
      totalProdutosVendidos += 1;
    });

    const detalhesProdutos = Object.entries(totaisPorProduto).map(([id, total]) => {
      const quantidade = quantidadesPorProduto[id];
      return {
        id: Number(id),
        nome: nomesProdutos[id],
        quantidade,
        total,
        media: quantidade ? total / quantidade : 0,
      };
    });

    const totalVendido = totalVendidoServicos + totalVendidoProdutos;

    let totalDespesas = 0;
    if (incluirDespesas) {
      const despesas = await Despesa.findAll({
        where: {
          SalaoId,
          createdAt: { [Op.between]: [startDate, endDate] },
        },
      });
      totalDespesas = despesas.reduce((sum, d) => sum + parseFloat(d.valor), 0);
    }

    const saldo = totalVendido - totalDespesas;

    res.json({
      dataInicio: startDate.toISOString().slice(0, 10),
      dataFim: endDate.toISOString().slice(0, 10),
      totalVendas: vendas.length,
      totalServicosVendidos,
      totalProdutosVendidos,
      detalhesServicos,
      detalhesProdutos,
      totalVendido,
      totalDespesas,
      saldo,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório completo:', error);
    res.status(500).json({ message: 'Erro no servidor ao gerar relatório' });
  }
});
















router.get('/dashboard', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const SalaoId = usuario.SalaoId;

    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date();
    fimSemana.setHours(23, 59, 59, 999);

    // Buscar vendas do dia e da semana do salão do usuário
    const vendasHoje = await Venda.findAll({
      where: {
        SalaoId,
        createdAt: { [Op.between]: [inicioDia, fimDia] }
      }
    });

    const vendasSemana = await Venda.findAll({
      where: {
        SalaoId,
        createdAt: { [Op.between]: [inicioSemana, fimSemana] }
      }
    });

    const vendaIdsHoje = vendasHoje.map(v => v.id);
    const vendaIdsSemana = vendasSemana.map(v => v.id);

    // Buscar serviços e produtos
    const servicos = await Servico.findAll();
    const produtos = await Produtos.findAll();

    // Mapear preços e nomes dos serviços e produtos
    const precosServicos = {}, precosProdutos = {}, nomesServicos = {}, nomesProdutos = {};
    servicos.forEach(s => {
      precosServicos[s.id] = parseFloat(s.preco);
      nomesServicos[s.id] = s.nome;
    });
    produtos.forEach(p => {
      precosProdutos[p.id] = parseFloat(p.precoVenda); // ✅ precoVenda aqui
      nomesProdutos[p.id] = p.nome;
    });

    // Vendas de serviços e produtos hoje e semana
    const vendaServicosHoje = await VendaServico.findAll({
      where: { VendaId: { [Op.in]: vendaIdsHoje } }
    });
    const vendaServicosSemana = await VendaServico.findAll({
      where: { VendaId: { [Op.in]: vendaIdsSemana } }
    });
    const vendaProdutosHoje = await VendaProduto.findAll({
      where: { VendaId: { [Op.in]: vendaIdsHoje } }
    });
    const vendaProdutosSemana = await VendaProduto.findAll({
      where: { VendaId: { [Op.in]: vendaIdsSemana } }
    });

    // Total vendas serviços hoje
    const totalVendasHojeServicos = vendaServicosHoje.reduce((total, vs) => {
      return total + (precosServicos[vs.ServicoId] || 0);
    }, 0);

    // Total vendas produtos hoje
    const totalVendasHojeProdutos = vendaProdutosHoje.reduce((total, vp) => {
      return total + (precosProdutos[vp.ProdutoId] || 0);
    }, 0);

    // Total vendas serviços semana e mais vendidos
    let totalSemanaServicos = 0;
    const servicosMaisVendidos = {};
    const vendasPorDia = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 };

    const vendasMap = {};
    vendasSemana.forEach(v => {
      vendasMap[v.id] = v.createdAt;
    });

    vendaServicosSemana.forEach(vs => {
      const id = vs.ServicoId;
      const preco = precosServicos[id] || 0;
      const dataVenda = vendasMap[vs.VendaId];
      const diaSemana = new Date(dataVenda).getDay();

      vendasPorDia[diaSemana] += preco;
      totalSemanaServicos += preco;
      if (!servicosMaisVendidos[id]) servicosMaisVendidos[id] = { nome: nomesServicos[id], quantidade: 0, total: 0 };
      servicosMaisVendidos[id].quantidade++;
      servicosMaisVendidos[id].total += preco;
    });

    // Total vendas produtos semana e mais vendidos
    let totalSemanaProdutos = 0;
    const produtosMaisVendidos = {};
    vendaProdutosSemana.forEach(vp => {
      const id = vp.ProdutoId;
      const preco = precosProdutos[id] || 0;
      totalSemanaProdutos += preco;
      if (!produtosMaisVendidos[id]) produtosMaisVendidos[id] = { nome: nomesProdutos[id], quantidade: 0, total: 0 };
      produtosMaisVendidos[id].quantidade++;
      produtosMaisVendidos[id].total += preco;
    });

    // Top 5 serviços e produtos
    const topServicos = Object.entries(servicosMaisVendidos)
      .map(([id, dados]) => ({ id: Number(id), ...dados }))
      .sort((a,b) => b.quantidade - a.quantidade)
      .slice(0,5);

    const topProdutos = Object.entries(produtosMaisVendidos)
      .map(([id, dados]) => ({ id: Number(id), ...dados }))
      .sort((a,b) => b.quantidade - a.quantidade)
      .slice(0,5);

    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const vendasPorDiaArray = dias.map((dia, i) => ({ dia, total: vendasPorDia[i] }));

    const totalVendasHoje = totalVendasHojeServicos + totalVendasHojeProdutos;
    const totalSemana = totalSemanaServicos + totalSemanaProdutos;

    res.json({
      quantidadeAtendimentosHoje: vendasHoje.length,
      totalVendasHoje,
      vendasDaSemana: totalSemana,
      servicosMaisVendidosSemana: topServicos,
      produtosMaisVendidosSemana: topProdutos,
      vendasPorDiaSemana: vendasPorDiaArray
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).json({ message: 'Erro ao carregar dados do dashboard' });
  }
});








router.get('/produtoresumo', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id)
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' })
    }
    const SalaoId = usuario.SalaoId

    // Data início e fim do mês corrente
    const dataInicio = new Date()
    dataInicio.setDate(1)
    dataInicio.setHours(0, 0, 0, 0)

    const dataFim = new Date(dataInicio)
    dataFim.setMonth(dataFim.getMonth() + 1)

    // Produtos do salão
    const produtos = await Produtos.findAll({
      where: { SalaoId },
      attributes: ['id', 'nome', 'precoCompra', 'precoVenda', 'quantidade']
    })

    // Vendas do salão no mês corrente
    const vendasDoSalao = await Venda.findAll({
      where: {
        SalaoId,
        createdAt: { [Op.gte]: dataInicio, [Op.lt]: dataFim }
      },
      attributes: ['id']
    })
    const vendaIds = vendasDoSalao.map(v => v.id)
    if (vendaIds.length === 0) vendaIds.push(null)

    // Vendas de produtos no mês corrente
    const vendasProdutos = await VendaProduto.findAll({
      where: {
        VendaId: { [Op.in]: vendaIds }
      },
      attributes: [
        'ProdutoId',
        [fn('COUNT', col('ProdutoId')), 'quantidadeVendida']
      ],
      group: ['ProdutoId']
    })

    // Mapear quantidade vendida por produto
    const vendasPorProduto = {}
    vendasProdutos.forEach(venda => {
      const produtoId = venda.get('ProdutoId')
      const quantidade = parseInt(venda.get('quantidadeVendida'), 10) || 0
      vendasPorProduto[produtoId] = quantidade
    })

    // Calcular dados financeiros dos produtos
    const produtosFinanceiro = produtos.map(produto => {
      const qtdVendida = vendasPorProduto[produto.id] || 0

      const precoCompra = Number(produto.precoCompra)
      const precoVenda = Number(produto.precoVenda)
      const quantidadeEstoque = Number(produto.quantidade)

      const totalInvestido = precoCompra * (qtdVendida + quantidadeEstoque)
      const totalVendido = precoVenda * qtdVendida
      const lucro = totalVendido - (precoCompra * qtdVendida)
      const margemLucro = totalVendido > 0 ? (lucro / totalVendido) * 100 : 0

      return {
        id: produto.id,
        nome: produto.nome,
        precoCompra: precoCompra.toFixed(2),
        precoVenda: precoVenda.toFixed(2),
        quantidadeEstoque,
        quantidadeVendida: qtdVendida,
        totalInvestido: totalInvestido.toFixed(2),
        receita: totalVendido.toFixed(2),
        lucro: lucro.toFixed(2),
        margemLucroPercentual: margemLucro.toFixed(2)
      }
    })

    // Alerta estoque baixo
    const alertaEstoqueBaixo = produtosFinanceiro.filter(p => p.quantidadeEstoque < 5)

    // Receita total em produtos no mês corrente
    const receitaTotalProdutos = produtosFinanceiro.reduce(
      (acc, p) => acc + parseFloat(p.receita),
      0
    )

    // --- RECEITA TOTAL SERVIÇOS NO MÊS CORRENTE ---

    // Buscar todos os serviços do salão
    const servicos = await Servico.findAll({
      where: { SalaoId },
      attributes: ['id', 'nome', 'preco']
    })

    // Buscar vendas de serviços no mês corrente
    const vendasServicos = await VendaServico.findAll({
      where: {
        VendaId: { [Op.in]: vendaIds }
      },
      attributes: [
        'ServicoId',
        [fn('COUNT', col('ServicoId')), 'quantidadeVendida']
      ],
      group: ['ServicoId']
    })

    // Mapear quantidade vendida por serviço
    const vendasPorServico = {}
    vendasServicos.forEach(venda => {
      const servicoId = venda.get('ServicoId')
      const quantidade = parseInt(venda.get('quantidadeVendida'), 10) || 0
      vendasPorServico[servicoId] = quantidade
    })

    // Calcular receita total de serviços no mês
    let receitaTotalServicos = 0
    servicos.forEach(servico => {
      const qtdVendida = vendasPorServico[servico.id] || 0
      const preco = Number(servico.preco)
      receitaTotalServicos += preco * qtdVendida
    })

    // Calcular lucro dos serviços (lucro = receita pois custo não informado)
    const servicosFinanceiro = servicos.map(servico => {
      const qtdVendida = vendasPorServico[servico.id] || 0
      const preco = Number(servico.preco)
      const receita = preco * qtdVendida
      const lucro = receita
      return {
        id: servico.id,
        nome: servico.nome,
        preco: preco.toFixed(2),
        quantidadeVendida: qtdVendida,
        receita: receita.toFixed(2),
        lucro: lucro.toFixed(2)
      }
    })

    // Ordenar serviços por lucro desc para mais lucrativos
    const servicosOrdenadosPorLucroDesc = servicosFinanceiro
      .filter(s => parseFloat(s.lucro) > 0)
      .sort((a, b) => parseFloat(b.lucro) - parseFloat(a.lucro))

    // Ordenar serviços por lucro asc para menos lucrativos (lucro >= 0)
    const servicosOrdenadosPorLucroAsc = servicosFinanceiro
      .filter(s => parseFloat(s.lucro) >= 0)
      .sort((a, b) => parseFloat(a.lucro) - parseFloat(b.lucro))

    // Evitar repetição nos menos lucrativos
    const maisLucrativosServicosIds = new Set(servicosOrdenadosPorLucroDesc.map(s => s.id))
    const menosLucrativosServicosFiltrados = servicosOrdenadosPorLucroAsc.filter(s => !maisLucrativosServicosIds.has(s.id))

    // Selecionar top 3 para cada lista
    const servicosMaisLucrativos = servicosOrdenadosPorLucroDesc.slice(0, 3)
    const servicosMenosLucrativos = menosLucrativosServicosFiltrados.slice(0, 3)

    // Ordenar produtos por lucro desc para mais lucrativos
    const produtosOrdenadosPorLucroDesc = produtosFinanceiro
      .filter(p => parseFloat(p.lucro) > 0)
      .sort((a, b) => parseFloat(b.lucro) - parseFloat(a.lucro))

    // Ordenar produtos por lucro asc para menos lucrativos (lucro >= 0)
    const produtosOrdenadosPorLucroAsc = produtosFinanceiro
      .filter(p => parseFloat(p.lucro) >= 0)
      .sort((a, b) => parseFloat(a.lucro) - parseFloat(b.lucro))

    // Evitar repetição nos menos lucrativos
    const maisLucrativosIds = new Set(produtosOrdenadosPorLucroDesc.map(p => p.id))
    const menosLucrativosFiltrados = produtosOrdenadosPorLucroAsc.filter(p => !maisLucrativosIds.has(p.id))

    // Selecionar top 3 para cada lista
    const produtosMaisLucrativos = produtosOrdenadosPorLucroDesc.slice(0, 3)
    const produtosMenosLucrativos = menosLucrativosFiltrados.slice(0, 3)

    return res.json({
      alertaEstoqueBaixo,
      receitaTotalProdutos: receitaTotalProdutos.toFixed(2),
      receitaTotalServicos: receitaTotalServicos.toFixed(2),
      produtosMaisLucrativos,
      produtosMenosLucrativos,
      servicosMaisLucrativos,
      servicosMenosLucrativos
    })

  } catch (erro) {
    console.error('Erro ao buscar resumo produtos:', erro)
    return res.status(500).json({ erro: 'Erro ao buscar resumo dos produtos.' })
  }
})



















router.delete('/servicos/:id', async (req, res) => {
  const id = req.params.id
  try {
    const servico = await Servico.findByPk(id)
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado.' })

    await servico.update({ ativo: false })
    res.json({ mensagem: 'Serviço desativado com sucesso.' })
  } catch (err) {
    console.error('Erro ao excluir serviço:', err)
    res.status(500).json({ erro: 'Falha ao excluir serviço.' })
  }
})




router.get('/painel/indicadores', auth, async (req, res) => {
  const agora = new Date();

  let inicioPeriodo;
  let fimPeriodo = agora;

  const periodo = req.query.periodo || 'mes';

  // Define os períodos conforme seleção
  if (periodo === 'hoje') {
    inicioPeriodo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
    fimPeriodo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
  } else if (periodo === 'semana') {
    const diaSemana = agora.getDay();
    const diffInicio = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioPeriodo = new Date(agora);
    inicioPeriodo.setDate(agora.getDate() - diffInicio);
    inicioPeriodo.setHours(0, 0, 0, 0);

    fimPeriodo = new Date(inicioPeriodo);
    fimPeriodo.setDate(inicioPeriodo.getDate() + 6);
    fimPeriodo.setHours(23, 59, 59, 999);
  } else if (periodo === 'mes') {
    inicioPeriodo = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
    fimPeriodo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (periodo === 'trimestre') {
    const trimestre = Math.floor(agora.getMonth() / 3);
    inicioPeriodo = new Date(agora.getFullYear(), trimestre * 3, 1, 0, 0, 0);
    fimPeriodo = new Date(agora.getFullYear(), (trimestre + 1) * 3, 0, 23, 59, 59, 999);
  } else if (periodo === 'semestre') {
    const semestre = agora.getMonth() < 6 ? 0 : 1;
    inicioPeriodo = new Date(agora.getFullYear(), semestre * 6, 1, 0, 0, 0);
    fimPeriodo = new Date(agora.getFullYear(), (semestre + 1) * 6, 0, 23, 59, 59, 999);
  } else if (periodo === 'ano') {
    inicioPeriodo = new Date(agora.getFullYear(), 0, 1, 0, 0, 0);
    fimPeriodo = new Date(agora.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (periodo === 'todos') {
    inicioPeriodo = null;
    fimPeriodo = null;
  } else {
    inicioPeriodo = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
    fimPeriodo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const SalaoId = usuario.SalaoId;

    const whereFiltro = { SalaoId };
    if (inicioPeriodo && fimPeriodo) {
      whereFiltro.createdAt = { [Op.between]: [inicioPeriodo, fimPeriodo] };
    } else if (inicioPeriodo) {
      whereFiltro.createdAt = { [Op.gte]: inicioPeriodo };
    }

    const vendasPeriodo = await Venda.findAll({
      where: whereFiltro,
      attributes: ['id', 'valorTotal', 'UsuarioId', 'clienteId']
    });

    const totalReceitas = vendasPeriodo.reduce((acc, venda) => acc + parseFloat(venda.valorTotal), 0);

    const whereDespesa = { SalaoId };
    if (inicioPeriodo && fimPeriodo) {
      whereDespesa.createdAt = { [Op.between]: [inicioPeriodo, fimPeriodo] };
    } else if (inicioPeriodo) {
      whereDespesa.createdAt = { [Op.gte]: inicioPeriodo };
    }

    const despesas = await Despesa.findAll({
      where: whereDespesa,
      attributes: ['valor']
    });
    const totalDespesas = despesas.reduce((acc, despesa) => acc + parseFloat(despesa.valor), 0);

    const clientesUnicos = [...new Set(vendasPeriodo.map(v => v.clienteId))];
    const ticketMedio = clientesUnicos.length > 0 ? totalReceitas / clientesUnicos.length : 0;

    // Buscar o FuncionarioTop baseado em VendaServico
    const idsVendas = vendasPeriodo.map(v => v.id);
    const vendaServicoWhere = { VendaId: idsVendas.length ? idsVendas : [0] };
    const servicosVendidos = await VendaServico.findAll({
      where: vendaServicoWhere,
      attributes: ['ServicoId', 'FuncionarioId']
    });

    const receitaPorFuncionario = {};
    servicosVendidos.forEach(vs => {
      if (vs.FuncionarioId) {
        receitaPorFuncionario[vs.FuncionarioId] = (receitaPorFuncionario[vs.FuncionarioId] || 0) + 1;
      }
    });

    let funcionarioTop = 'Nenhum';
    let maiorReceita = 0;
    const funcionarios = await Funcionario.findAll({ where: { SalaoId }, attributes: ['id', 'nome'] });

    funcionarios.forEach(func => {
      if (receitaPorFuncionario[func.id] && receitaPorFuncionario[func.id] > maiorReceita) {
        funcionarioTop = func.nome;
        maiorReceita = receitaPorFuncionario[func.id];
      }
    });

    const contagemServicos = {};
    servicosVendidos.forEach(s => {
      contagemServicos[s.ServicoId] = (contagemServicos[s.ServicoId] || 0) + 1;
    });

    let servicoTop = 'Nenhum';
    let maisVendido = 0;
    const servicos = await Servico.findAll({ attributes: ['id', 'nome', 'preco'] });
    servicos.forEach(s => {
      if (contagemServicos[s.id] && contagemServicos[s.id] > maisVendido) {
        servicoTop = s.nome;
        maisVendido = contagemServicos[s.id];
      }
    });

    let totalServicos = 0;
    servicosVendidos.forEach(sv => {
      const servico = servicos.find(s => s.id === sv.ServicoId);
      if (servico) {
        totalServicos += parseFloat(servico.preco);
      }
    });

    // Produtos vendidos
    const vendaProdutoWhere = { VendaId: idsVendas.length ? idsVendas : [0] };
    const produtosVendidos = await VendaProduto.findAll({
      where: vendaProdutoWhere,
      attributes: ['ProdutoId']
    });

    const produtos = await Produtos.findAll({ where: { SalaoId }, attributes: ['id', 'nome', 'precoVenda'] });

    let totalProdutos = 0;
    produtosVendidos.forEach(pv => {
      const produto = produtos.find(p => p.id === pv.ProdutoId);
      if (produto) {
        totalProdutos += parseFloat(produto.precoVenda);
      }
    });

    // Buscando o cliente destacado
    const clienteValor = {};
    vendasPeriodo.forEach(v => {
      if (v.clienteId) {
        clienteValor[v.clienteId] = (clienteValor[v.clienteId] || 0) + parseFloat(v.valorTotal);
      }
    });

    let clienteTop = 'Nenhum';
    let maiorGasto = 0;
    const clientes = await Cliente.findAll({ where: { SalaoId }, attributes: ['id', 'nome'] });

    clientes.forEach(cliente => {
      if (clienteValor[cliente.id] && clienteValor[cliente.id] > maiorGasto) {
        clienteTop = cliente.nome;
        maiorGasto = clienteValor[cliente.id];
      }
    });

    // Calculando a variação de lucro entre o período atual e o anterior
    let variacao = 0;
    if (periodo !== 'todos') {
      let inicioAnterior;
      let fimAnterior;

      // Configuração para o cálculo do período anterior
      if (periodo === 'hoje') {
        inicioAnterior = new Date(inicioPeriodo);
        inicioAnterior.setDate(inicioAnterior.getDate() - 1);
        fimAnterior = new Date(fimPeriodo);
        fimAnterior.setDate(fimAnterior.getDate() - 1);
      } else if (periodo === 'semana') {
        inicioAnterior = new Date(inicioPeriodo);
        inicioAnterior.setDate(inicioAnterior.getDate() - 7);
        fimAnterior = new Date(inicioPeriodo);
        fimAnterior.setDate(inicioAnterior.getDate() - 1);
        fimAnterior.setHours(23, 59, 59, 999);
      } else if (periodo === 'mes') {
        inicioAnterior = new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth() - 1, 1);
        fimAnterior = new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth(), 0, 23, 59, 59, 999);
      } else if (periodo === 'trimestre') {
        const trimestreAtual = Math.floor(inicioPeriodo.getMonth() / 3);
        const trimestreAnterior = trimestreAtual - 1;
        inicioAnterior = new Date(inicioPeriodo.getFullYear(), trimestreAnterior * 3, 1);
        fimAnterior = new Date(inicioPeriodo.getFullYear(), trimestreAtual * 3, 0, 23, 59, 59, 999);
      } else if (periodo === 'semestre') {
        const semestreAtual = inicioPeriodo.getMonth() < 6 ? 0 : 1;
        const semestreAnterior = semestreAtual - 1;
        if (semestreAnterior < 0) {
          inicioAnterior = new Date(inicioPeriodo.getFullYear() - 1, 6, 1);
          fimAnterior = new Date(inicioPeriodo.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        } else {
          inicioAnterior = new Date(inicioPeriodo.getFullYear(), semestreAnterior * 6, 1);
          fimAnterior = new Date(inicioPeriodo.getFullYear(), semestreAtual * 6, 0, 23, 59, 59, 999);
        }
      } else if (periodo === 'ano') {
        inicioAnterior = new Date(inicioPeriodo.getFullYear() - 1, 0, 1);
        fimAnterior = new Date(inicioPeriodo.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      }

      if (inicioAnterior && fimAnterior) {
        const vendasAnterior = await Venda.findAll({
          where: {
            SalaoId,
            createdAt: {
              [Op.between]: [inicioAnterior, fimAnterior]
            }
          },
          attributes: ['valorTotal']
        });
        const totalAnterior = vendasAnterior.reduce((acc, venda) => acc + parseFloat(venda.valorTotal), 0);

        if (totalAnterior > 0) {
          variacao = ((totalReceitas - totalAnterior) / totalAnterior) * 100;
        } else {
          variacao = 0;
        }
      }
    }

    res.json({
      totalReceitas: totalReceitas.toFixed(2),
      totalDespesas: totalDespesas.toFixed(2),
      lucro: (totalReceitas - totalDespesas).toFixed(2),
      ticketMedio: ticketMedio.toFixed(2),
      funcionarioTop,
      clienteTop,  // Cliente destacado
      servicoTop,
      totalServicos: totalServicos.toFixed(2),
      totalProdutos: totalProdutos.toFixed(2),
      variacaoLucro: variacao.toFixed(2)
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar indicadores' });
  }
});








const moment = require('moment');

// Função para gerar os últimos 6 meses no formato YYYY-MM
const gerarUltimosMeses = () => {
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    meses.push(moment().subtract(i, 'months').format('YYYY-MM'));
  }
  return meses;
};








require('moment/locale/pt-br'); // habilita pt-br
moment.locale('pt-br');

router.get('/painel-analitico/graficos', auth, async (req, res) => {
  try {
    // Pega o usuário logado
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });

    const SalaoId = usuario.SalaoId;

    // Pega os 5 últimos meses com vendas reais
    const datasVendas = await Venda.findAll({
      where: { SalaoId },
      attributes: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'mes']],
      group: ['mes'],
      order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'DESC']],
      limit: 5
    });

    const meses = datasVendas.map(v => v.dataValues.mes).sort(); // mais antigo primeiro

    // 1. Vendas de serviços (valorTotal por mês)
    const vendasPorMes = await Venda.findAll({
      where: { SalaoId },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'mes'],
        [fn('SUM', col('valorTotal')), 'total']
      ],
      group: ['mes']
    });

    // 2. Despesas por mês
    const despesasPorMes = await Despesa.findAll({
      where: { SalaoId },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'mes'],
        [fn('SUM', col('valor')), 'total']
      ],
      group: ['mes']
    });

    // 3. Produtos vendidos
    const vendaProdutos = await VendaProduto.findAll();

    const produtos = await Produtos.findAll({
      where: { SalaoId },
      attributes: ['id', 'precoVenda']
    });
    const produtosMap = Object.fromEntries(produtos.map(p => [p.id, parseFloat(p.precoVenda)]));

    const vendas = await Venda.findAll({
      where: { SalaoId },
      attributes: ['id', 'createdAt']
    });
    const vendasMap = Object.fromEntries(vendas.map(v => [v.id, v.createdAt]));

    const receitaProdutosPorMes = {};
    for (const vp of vendaProdutos) {
      const vendaId = vp.get('VendaId');
      const produtoId = vp.get('ProdutoId');
      const createdAt = vendasMap[vendaId];
      const preco = produtosMap[produtoId] || 0;

      if (!createdAt) continue;

      const mes = moment(createdAt).format('YYYY-MM');
      receitaProdutosPorMes[mes] = (receitaProdutosPorMes[mes] || 0) + preco;
    }

    // 4. Monta gráfico financeiro (serviços + produtos - despesas)
    const financeiro = meses.map(mes => {
      const receitaServicos = parseFloat(vendasPorMes.find(v => v.dataValues.mes === mes)?.dataValues.total || 0);
      const receitaProdutos = parseFloat(receitaProdutosPorMes[mes] || 0);
      const despesa = parseFloat(despesasPorMes.find(d => d.dataValues.mes === mes)?.dataValues.total || 0);

      return {
        nome: moment(mes, 'YYYY-MM').format('MMM/YYYY'),
        quantidade: receitaServicos + receitaProdutos - despesa
      };
    });

    const receitaPorMes = meses.map(mes => {
      const receitaServicos = parseFloat(vendasPorMes.find(v => v.dataValues.mes === mes)?.dataValues.total || 0);
      const receitaProdutos = parseFloat(receitaProdutosPorMes[mes] || 0);

      return {
        nome: moment(mes, 'YYYY-MM').format('MMM/YYYY'),
        quantidade: receitaServicos + receitaProdutos
      };
    });

    const despesaPorMes = meses.map(mes => ({
      nome: moment(mes, 'YYYY-MM').format('MMM/YYYY'),
      quantidade: parseFloat(despesasPorMes.find(d => d.dataValues.mes === mes)?.dataValues.total || 0)
    }));

    const receitaDespesaDetalhado = {
      receita: receitaPorMes,
      despesa: despesaPorMes
    };

    // 5. Vendas por funcionário (agora usando FuncionarioId de VendaServico)
    const vendasFuncionarios = await VendaServico.findAll({
      where: { SalaoId },
      attributes: ['FuncionarioId', [fn('COUNT', col('ServicoId')), 'quantidade']],
      group: ['FuncionarioId']
    });

    // Pega todos os funcionários ativos
    const funcionarios = await Funcionario.findAll({
      where: { SalaoId, ativo: 1 },
      attributes: ['id', 'nome']
    });

    // Mapeia os dados dos funcionários
    const funcionariosMap = Object.fromEntries(funcionarios.map(f => [f.id, f.nome]));

    // Mapeia as vendas dos funcionários
    const funcionariosVenda = vendasFuncionarios.map(v => {
      const funcionarioId = v.get('FuncionarioId');
      return {
        nome: funcionariosMap[funcionarioId] || 'Desconhecido',
        quantidade: parseInt(v.get('quantidade'))
      };
    });

    // 6. Serviços mais vendidos
    const idsVendas = vendas.map(v => v.id);

    let servicos = [];
    if (idsVendas.length > 0) {
      const vendasServicos = await VendaServico.findAll({
        where: { VendaId: idsVendas },
        attributes: [
          'ServicoId',
          [fn('COUNT', col('ServicoId')), 'quantidade']
        ],
        group: ['ServicoId']
      });

      const servicoIds = vendasServicos.map(v => v.get('ServicoId')).filter(Boolean);
      const servicosInfo = await Servico.findAll({
        where: { id: servicoIds },
        attributes: ['id', 'nome']
      });

      const servicosMap = Object.fromEntries(servicosInfo.map(s => [s.id, s.nome]));

      servicos = vendasServicos.map(v => {
        const servicoId = v.get('ServicoId');
        return {
          nome: servicosMap[servicoId] || 'N/A',
          quantidade: parseInt(v.get('quantidade'))
        };
      });
    }

    res.json({
      financeiro,
      funcionarios: funcionariosVenda,
      servicos,
      receitaDespesaDetalhado
    });

    console.log('Dados do painel analítico enviados com sucesso.');
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao carregar dados dos gráficos.' });
  }
});














const Cliente = require("../models/clientes");

















const dayjs = require('dayjs')


router.get('/painel-analitico/listagens', auth, async (req, res) => {
  try {
    const { funcionarioId, servicoId, periodo } = req.query;

    // Pega funcionário (não mais usuário)
    const funcionario = funcionarioId ? await Funcionario.findByPk(funcionarioId) : null;
    if (funcionarioId && !funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    const SalaoId = funcionario ? funcionario.SalaoId : (await Usuario.findByPk(req.usuario.id)).SalaoId;

    const whereVenda = { SalaoId };
    const whereDespesa = { SalaoId };

    // Calcular intervalo de datas conforme o período
    if (periodo) {
      const hoje = dayjs().startOf('day');
      let inicio, fim;

      switch (periodo) {
        case 'hoje':
          inicio = hoje;
          fim = hoje.endOf('day');
          break;
        case 'semana':
          inicio = hoje.startOf('week');
          fim = hoje.endOf('week');
          break;
        case 'mes':
          inicio = hoje.startOf('month');
          fim = hoje.endOf('month');
          break;
        case 'trimestre':
          inicio = hoje.startOf('quarter');
          fim = hoje.endOf('quarter');
          break;
        case 'semestre':
          inicio = hoje.month() < 6
            ? hoje.startOf('year')
            : hoje.month(6).startOf('month');
          fim = hoje.month() < 6
            ? hoje.month(5).endOf('month')
            : hoje.endOf('year');
          break;
        case 'ano':
          inicio = hoje.startOf('year');
          fim = hoje.endOf('year');
          break;
        default:
          break;
      }

      if (inicio && fim) {
        whereVenda.dataVenda = { [Op.between]: [inicio.toDate(), fim.toDate()] };
        whereDespesa.dataDespesa = { [Op.between]: [inicio.toDate(), fim.toDate()] };
      }
    }

    // Se houver um funcionarioId específico, filtra as vendas pela função do funcionário
    if (funcionarioId) {
      whereVenda['$VendaServicos.FuncionarioId$'] = funcionarioId;  // Aqui associamos à tabela de vendas servicos
    }

    // Busca as vendas do salão (agora associadas ao FuncionarioId)
    const vendas = await Venda.findAll({
      where: whereVenda,
      include: [{
        model: VendaServico,
        as: 'VendaServicos',
        attributes: ['FuncionarioId'], // Precisamos incluir o FuncionarioId
      }],
      raw: true,
    });

    // Busca dados gerais já filtrando pelo salão
    const [funcionarios, clientes, servicos, vendasServicos] = await Promise.all([
      Funcionario.findAll({ where: { SalaoId }, raw: true }),
      Cliente.findAll({ where: { SalaoId }, raw: true }),
      Servico.findAll({ where: { SalaoId }, raw: true }),
      VendaServico.findAll({
        raw: true,
        where: { VendaId: vendas.map(v => v.id) }
      })
    ]);

    const vendasDetalhadas = vendas
      .map(venda => {
        const cliente = clientes.find(c => c.id === venda.clienteId);
        const funcionario = funcionarios.find(f => f.id === venda['VendaServicos.FuncionarioId']);

        const servicosDaVendaIds = vendasServicos
          .filter(vs => vs.VendaId === venda.id)
          .map(vs => vs.ServicoId);

        const nomesServicos = servicos
          .filter(s => servicosDaVendaIds.includes(s.id))
          .map(s => s.nome);

        if (servicoId && !servicosDaVendaIds.includes(Number(servicoId))) {
          return null;
        }

        return {
          id: venda.id,
          cliente: cliente?.nome || 'N/A',
          funcionario: funcionario?.nome || 'N/A',
          valor: venda.valorTotal,
          data: venda.dataVenda,
          servicos: nomesServicos
        };
      })
      .filter(Boolean);

    const despesas = await Despesa.findAll({ where: whereDespesa, raw: true });

    const despesasDetalhadas = despesas.map(d => ({
      id: d.id,
      descricao: d.descricao,
      tipo: d.tipo,
      valor: d.valor,
      data: d.dataDespesa
    }));

    res.json({
      vendas: vendasDetalhadas,
      despesas: despesasDetalhadas
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar dados do painel analítico.' });
  }
});





router.get('/lista-servicos', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Buscar todas as categorias do salão
    const categorias = await CategoriaServico.findAll({
      where: { SalaoId: usuario.SalaoId },
      attributes: ['id', 'nome'],
      order: [['nome', 'ASC']],
      raw: true
    });

    // Para cada categoria, buscar somente os serviços ativos
    const categoriasComServicos = await Promise.all(
      categorias.map(async (categoria) => {
        const servicosAtivos = await Servico.findAll({
          where: {
            SalaoId: usuario.SalaoId,
            CategoriaServicoId: categoria.id,
            ativo: true    // FILTRA SÓ OS ATIVOS
          },
          attributes: ['id', 'nome', 'descricao', 'preco', 'ativo'],
          order: [['createdAt', 'DESC']],
          raw: true
        });

        return {
          ...categoria,
          servicos: servicosAtivos
        };
      })
    );

    res.json(categoriasComServicos);
  } catch (err) {
    console.error('Erro ao buscar serviços agrupados:', err);
    res.status(500).json({ erro: 'Erro ao buscar serviços.' });
  }
});




// GET /lista-produtos
router.get('/lista-produtos', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const produtos = await Produtos.findAll({
      where: { SalaoId: usuario.SalaoId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos.' });
  }
});

router.get('/todos-produtos', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const produtos = await Produtos.findAll({
      attributes: ['id', 'nome', 'precoVenda', 'descricao', 'ativo'],  // Adicionando 'precoVenda'
      where: { SalaoId: usuario.SalaoId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos.' });
  }
});



router.patch('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, precoVenda, quantidade, categoria, ativo } = req.body;

  try {
    const produto = await Produtos.findByPk(id);

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    await produto.update({ nome, descricao, precoVenda, quantidade, categoria, ativo });
    return res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ erro: 'Erro interno ao atualizar produto.' });
  }
});


// Excluir produto - DELETE /produtos/:id
router.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const produto = await Produtos.findByPk(id);

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    await produto.destroy();
    return res.json({ mensagem: 'Produto excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return res.status(500).json({ erro: 'Erro interno ao excluir produto.' });
  }
});



router.get('/todos-funcionarios', auth, async (req, res) => {
  try {
    const usuarioLogado = await Usuario.findByPk(req.usuario.id);
    if (!usuarioLogado) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const funcionarios = await Usuario.findAll({
      attributes: ['id', 'nome'],
      where: { SalaoId: usuarioLogado.SalaoId },
      raw: true
    });

    res.json(funcionarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar funcionários' });
  }
});






router.get('/relatorio/funcionarios', auth, async (req, res) => {
  const { periodo, inicio, fim, funcionarios } = req.query;

  let dataInicio, dataFim;
  const hoje = new Date();

  // Passo 1: Obter o SalaoId do usuário logado
  const usuarioId = req.usuario.id;
  const usuario = await Usuario.findOne({
    where: { id: usuarioId },
    attributes: ['id', 'SalaoId'],
    raw: true,
  });

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const salaoId = usuario.SalaoId;

  // Passo 2: Definir os períodos com base nas escolhas do usuário
  switch (periodo) {
    case 'hoje':
      dataInicio = new Date(hoje.setHours(0, 0, 0, 0));
      dataFim = new Date(hoje.setHours(23, 59, 59, 999));
      break;
    case 'semana':
      const diaSemana = hoje.getDay();
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - diaSemana);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      break;
    case 'mes':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      break;
    case 'trimestre':
      const mesAtual = hoje.getMonth();
      const inicioTrimestre = mesAtual - (mesAtual % 3);
      dataInicio = new Date(hoje.getFullYear(), inicioTrimestre, 1);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      break;
    case 'personalizado':
      if (!inicio || !fim) {
        return res.status(400).json({ erro: 'Datas de início e fim são obrigatórias.' });
      }
      dataInicio = new Date(inicio);
      dataFim = new Date(fim);
      dataFim.setHours(23, 59, 59, 999);
      break;
    default:
      return res.status(400).json({ erro: 'Período inválido.' });
  }

  try {
    // Passo 3: Filtrar funcionários pelo SalaoId e pelos ids fornecidos
    const idsSelecionados = funcionarios
      ? funcionarios.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];

    if (idsSelecionados.length === 0) {
      return res.json([]); // Nenhum funcionário selecionado
    }

    // Obter os funcionários do salão do usuário logado
    const funcionariosDoSalao = await Funcionario.findAll({
      where: {
        SalaoId: salaoId,
        id: { [Op.in]: idsSelecionados }
      },
      raw: true
    });

    // Passo 4: Obter as vendas de serviços
    const vendasServicos = await VendaServico.findAll({
      where: {
        SalaoId: salaoId,
        FuncionarioId: { [Op.in]: idsSelecionados },
        createdAt: {
          [Op.between]: [dataInicio, dataFim]
        }
      },
      attributes: ['FuncionarioId', 'ServicoId'],
      raw: true
    });

    // Passo 5: Associar receita para cada funcionário
    const dadosPorFuncionario = {};

    // Para cada VendaServico, associar o preço do serviço
    for (const vendaServico of vendasServicos) {
      const id = vendaServico.FuncionarioId;
      const servico = await Servico.findOne({
        where: { id: vendaServico.ServicoId },
        attributes: ['preco'],
        raw: true
      });

      const precoServico = parseFloat(servico.preco);
      if (!isNaN(precoServico)) {
        dadosPorFuncionario[id] = dadosPorFuncionario[id] || {
          atendimentos: 0,
          receitaTotal: 0,
          ultimoAtendimento: null,
        };

        dadosPorFuncionario[id].atendimentos++;
        dadosPorFuncionario[id].receitaTotal += precoServico;
      }
    }

    // Passo 6: Preparar o relatório
    const relatorio = [];

    for (const funcionario of funcionariosDoSalao) {
      const dados = dadosPorFuncionario[funcionario.id] || {
        atendimentos: 0,
        receitaTotal: 0,
      };

      // Encontrar o último atendimento na tabela VendaServico
      const ultimoAtendimento = await VendaServico.findOne({
        where: { FuncionarioId: funcionario.id },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt'],
        raw: true
      });

      // Preencher o campo de último atendimento
      dados.ultimoAtendimento = ultimoAtendimento ? ultimoAtendimento.createdAt : null;

      // Adicionar os dados no relatório
      relatorio.push({
        nome: funcionario.nome,
        funcao: funcionario.funcao,
        status: funcionario.ativo ? 'Ativo' : 'Inativo',
        atendimentos: dados.atendimentos,
        receitaTotal: dados.receitaTotal.toFixed(2),
        ultimoAtendimento: dados.ultimoAtendimento ? new Date(dados.ultimoAtendimento).toLocaleString() : 'N/A',
      });
    }

    res.json(relatorio);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar relatório de funcionários' });
  }
});





router.get('/perfil', auth, async (req, res) => {
  try {
    const usuarioId = req.usuario.id; // Pegando o id do usuário logado

    // Primeiro buscamos o usuário no banco para pegar o SalaoId
    const usuario = await Usuario.findOne({
      where: { id: usuarioId },
      attributes: ['id', 'nome', 'email', 'funcao', 'ativo', 'SalaoId', 'createdAt'], // Incluímos o SalaoId aqui
      raw: true,
    });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const salaoId = usuario.SalaoId; // Pegando o SalaoId do usuário encontrado
    console.log('usuarioId:', usuarioId, 'SalaoId:', salaoId); // Verificando se os valores estão corretos

    // Verificando se o SalaoId existe
    if (!salaoId) {
      return res.status(400).json({ erro: 'SalaoId não encontrado para o usuário.' });
    }

    // Total de vendas feitas pelo usuário no salão específico
    const totalVendas = await Venda.count({
      where: { UsuarioId: usuarioId, SalaoId: salaoId } // Filtra pelo SalaoId
    });

    // Valor total vendido pelo usuário no salão específico
    const valorTotalVendido = await Venda.sum('valorTotal', {
      where: { UsuarioId: usuarioId, SalaoId: salaoId } // Filtra pelo SalaoId
    }) || 0;

    // Últimas 5 vendas feitas pelo usuário no salão específico
    const ultimasVendas = await Venda.findAll({
      where: { UsuarioId: usuarioId, SalaoId: salaoId }, // Filtra pelo SalaoId
      attributes: ['dataVenda', 'valorTotal', 'observacoes'],
      order: [['dataVenda', 'DESC']],
      limit: 5,
      raw: true,
    });

    // Se for admin, envia dados extras filtrados pelo SalaoId
    if (usuario.funcao === 'admin') {
      const totalUsuarios = await Usuario.count({
        where: { SalaoId: salaoId } // Filtra pelo SalaoId
      });
      const totalClientes = await Cliente.count({
        where: { SalaoId: salaoId } // Filtra pelo SalaoId
      });
      const totalServicos = await Servico.count({
        where: { SalaoId: salaoId } // Filtra pelo SalaoId
      });

      return res.json({
        usuario,
        totalVendas,
        valorTotalVendido,
        ultimasVendas,
        adminExtra: {
          totalUsuarios,
          totalClientes,
          totalServicos
        }
      });
    }

    // Para usuários comuns, sem extras
    return res.json({
      usuario,
      totalVendas,
      valorTotalVendido,
      ultimasVendas
    });

  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});





















router.get('/gerir-usuarios', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    // Buscar o usuário completo pra obter o SalaoId
    const usuarioLogado = await Usuario.findByPk(req.usuario.id);
    if (!usuarioLogado) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const salaoId = usuarioLogado.SalaoId;

    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nome', 'email', 'funcao', 'ativo', 'createdAt'],
      where: { SalaoId: salaoId },
      order: [['createdAt', 'DESC']],
      raw: true
    });

    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar usuários' });
  }
});



// Exclui um usuário
router.delete('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    await usuario.destroy();

    res.json({ mensagem: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao excluir usuário' });
  }
});


// GET /salao/:id/usuarios
router.get('/salao/:id/usuarios', auth, async (req, res) => {
  try {
    const salaoId = req.params.id;
    const usuarios = await Usuario.findAll({
      where: { SalaoId: salaoId },
      attributes: ['id', 'nome', 'email', 'funcao', 'ativo']
    });
    res.json({ usuarios });
  } catch (err) {
    console.error('Erro ao buscar usuários do salão:', err);
    res.status(500).json({ erro: 'Falha interna ao buscar usuários.' });
  }
});





router.get('/usuarios/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nome', 'email', 'funcao', 'SalaoId']
    });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({ usuario });
  } catch (error) {
    console.error('Erro ao buscar usuário logado:', error);
    res.status(500).json({ erro: 'Erro interno ao buscar usuário.' });
  }
});





router.get('/meu-usuario-e-salao', auth, async (req, res) => {
  try {
    // Busca o usuário autenticado pelo ID
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nome', 'email', 'funcao', 'SalaoId']
    });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    // Se o usuário for um super_admin, não precisa verificar o salão
    if (usuario.funcao === 'super_admin') {
      // Retorna o usuário sem a verificação de salão
      return res.json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          funcao: usuario.funcao,
          SalaoId: usuario.SalaoId,
          Salão: null, // Nenhuma informação de salão é necessária
        },
      });
    }

    // Se o usuário não for super_admin, verifica se ele tem um salão associado
    let salao = null;
    if (usuario.SalaoId) {
      salao = await Salao.findOne({
        where: { id: usuario.SalaoId },
        attributes: ['id', 'nome', 'status'],
      });
    }

    // Monta o resultado com as informações do usuário e salão
    const resultado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      funcao: usuario.funcao,
      SalaoId: usuario.SalaoId,
      Salão: salao ? {
        id: salao.id,
        nome: salao.nome,
        status: salao.status
      } : null
    };

    return res.json({ usuario: resultado });
  } catch (error) {
    console.error('Erro ao obter informações do usuário e salão:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});




// PUT /usuarios/:id/funcao — Atualiza função do usuário
router.put('/usuarios/:id/funcao', auth, async (req, res) => {
  const { id } = req.params;
  const { funcao } = req.body;

  // Lista das funções válidas
  const funcoesValidas = ['super_admin', 'admin', 'recepcionista', 'profissional'];

  // Validação do token: só super_admin e admin podem alterar funções
  if (!['admin', 'super_admin'].includes(req.usuario.funcao)) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  // Validação da função enviada
  if (!funcoesValidas.includes(funcao)) {
    return res.status(400).json({ erro: 'Função inválida.' });
  }

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    usuario.funcao = funcao;
    await usuario.save();

    return res.json({ mensagem: 'Função atualizada com sucesso.', usuario });
  } catch (error) {
    console.error('Erro ao atualizar função do usuário:', error);
    return res.status(500).json({ erro: 'Erro interno ao atualizar função.' });
  }
});



// Atualiza status (ativo/inativo) de um usuário
router.put('/usuarios/:id/status', auth, async (req, res) => {
  try {
    // Permite admin ou super_admin
if (!['admin', 'super_admin'].includes(req.usuario.funcao)) {
  return res.status(403).json({ erro: 'Acesso negado' });
}


    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    usuario.ativo = req.body.ativo;
    await usuario.save();

    res.json({ mensagem: 'Status atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar status' });
  }
});






router.put('/usuarios/me/dados', auth, async (req, res) => {
  try {
    const { nome, email } = req.body;
    const usuarioId = req.usuario.id;

    const dadosAtualizar = {};
    if (nome) dadosAtualizar.nome = nome;
    if (email) {
      // Verifica se o novo e-mail já está sendo usado por outro usuário
      const emailEmUso = await Usuario.findOne({
        where: {
          email,
          id: { [Op.ne]: usuarioId }
        }
      });
      if (emailEmUso) {
        return res.status(400).json({ erro: 'Este e-mail já está em uso por outro usuário.' });
      }
      dadosAtualizar.email = email;
    }

    if (Object.keys(dadosAtualizar).length === 0) {
      return res.status(400).json({ erro: 'Nenhum dado enviado para atualização.' });
    }

    await Usuario.update(dadosAtualizar, { where: { id: usuarioId } });
    res.json({ mensagem: 'Dados atualizados com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    res.status(500).json({ erro: 'Erro interno ao atualizar dados.' });
  }
});



// Atualizar senha do usuário autenticado
router.put('/usuarios/me/senha', auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    // Verifica se a senha atual está correta
    const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaConfere) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await Usuario.update({ senha: novaSenhaHash }, { where: { id: usuarioId } });

    res.json({ mensagem: 'Senha atualizada com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ erro: 'Erro interno ao atualizar senha.' });
  }
});
















router.post('/usuarios/cadastrar-por-admin', auth, async (req, res) => {
  try {
    const { nome, email, senha, funcao } = req.body

    if (!nome || !email || !senha || !funcao) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' })
    }

    const funcoesPermitidas = ['recepcionista', 'profissional']
    if (!funcoesPermitidas.includes(funcao)) {
      return res.status(403).json({ erro: 'Função inválida para cadastro por admin.' })
    }

    const admin = await Usuario.findByPk(req.usuario.id)
    if (!admin) {
      return res.status(404).json({ erro: 'Usuário admin não encontrado.' })
    }

    if (admin.funcao !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado.' })
    }

    const existeEmail = await Usuario.findOne({ where: { email } })
    if (existeEmail) {
      return res.status(409).json({ erro: 'Email já cadastrado.' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashSenha = await bcrypt.hash(senha, salt)

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: hashSenha,
      funcao,
      ativo: true,
      SalaoId: admin.SalaoId
    })

    const { senha: _, ...usuarioSemSenha } = novoUsuario.toJSON()

    res.status(201).json(usuarioSemSenha)
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error)
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' })
  }
})














const { fn, col } = require('sequelize');


router.get('/painel/financeiro-produtos-servicos', auth, async (req, res) => {
  try {
    // Buscar o usuário autenticado
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const SalaoId = usuario.SalaoId;

    // ----------- PRODUTOS -----------

    const produtos = await Produtos.findAll({
      where: { SalaoId },
      attributes: ['id', 'nome', 'precoCompra', 'precoVenda', 'quantidade']
    });

    const vendasDoSalao = await Venda.findAll({
      where: { SalaoId },
      attributes: ['id']
    });

    const vendaIds = vendasDoSalao.map(v => v.id);
    if (vendaIds.length === 0) vendaIds.push(null); // evita WHERE IN []

    const vendasProdutos = await VendaProduto.findAll({
      where: {
        VendaId: { [Op.in]: vendaIds }
      },
      attributes: [
        'ProdutoId',
        [fn('COUNT', col('ProdutoId')), 'quantidadeVendida']
      ],
      group: ['ProdutoId']
    });

    const vendasPorProduto = {};
    vendasProdutos.forEach(venda => {
      const produtoId = venda.get('ProdutoId');
      const quantidade = parseInt(venda.get('quantidadeVendida'), 10) || 0;
      vendasPorProduto[produtoId] = quantidade;
    });

    const produtosFinanceiro = produtos.map(produto => {
      const qtdVendida = vendasPorProduto[produto.id] || 0;

      const precoCompra = Number(produto.precoCompra);
      const precoVenda = Number(produto.precoVenda);
      const quantidadeEstoque = Number(produto.quantidade);

      const totalInvestido = precoCompra * (qtdVendida + quantidadeEstoque);
      const totalVendido = precoVenda * qtdVendida;
      const lucro = totalVendido - (precoCompra * qtdVendida);
      const margemLucro = totalVendido > 0 ? (lucro / totalVendido) * 100 : 0;

      return {
        id: produto.id,
        nome: produto.nome,
        precoCompra: precoCompra.toFixed(2),
        precoVenda: precoVenda.toFixed(2),
        quantidadeEstoque,
        quantidadeVendida: qtdVendida,
        totalInvestido: totalInvestido.toFixed(2),
        totalVendido: totalVendido.toFixed(2),
        lucro: lucro.toFixed(2),
        margemLucroPercentual: margemLucro.toFixed(2)
      };
    });

    // ----------- SERVIÇOS -----------

    const servicos = await Servico.findAll({
      where: { SalaoId },
      attributes: ['id', 'nome', 'preco']
    });

    const vendasServicos = await VendaServico.findAll({
      where: {
        VendaId: { [Op.in]: vendaIds }
      },
      attributes: [
        'ServicoId',
        [fn('COUNT', col('ServicoId')), 'quantidadeVendida']
      ],
      group: ['ServicoId']
    });

    const vendasPorServico = {};
    vendasServicos.forEach(venda => {
      const servicoId = venda.get('ServicoId');
      const quantidade = parseInt(venda.get('quantidadeVendida'), 10) || 0;
      vendasPorServico[servicoId] = quantidade;
    });

    const servicosFinanceiro = servicos.map(servico => {
      const qtdVendida = vendasPorServico[servico.id] || 0;
      const preco = Number(servico.preco);
      const receitaTotal = preco * qtdVendida;
      const lucroEstimado = receitaTotal; // supondo lucro = receita para serviços
      const precoMedio = qtdVendida > 0 ? receitaTotal / qtdVendida : 0;

      return {
        id: servico.id,
        nome: servico.nome,
        preco: preco.toFixed(2),
        quantidadeVendida: qtdVendida,
        receitaTotal: receitaTotal.toFixed(2),
        lucroEstimado: lucroEstimado.toFixed(2),
        precoMedio: precoMedio.toFixed(2)
      };
    });

    // Filtrar para retornar apenas produtos e serviços com vendas > 0
    const produtosVendidos = produtosFinanceiro.filter(p => p.quantidadeVendida > 0);
    const servicosVendidos = servicosFinanceiro.filter(s => s.quantidadeVendida > 0);

    // Enviar resposta final
    return res.json({
      produtos: produtosVendidos,
      servicos: servicosVendidos
    });

  } catch (erro) {
    console.error('Erro ao buscar dados financeiros:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar dados financeiros.' });
  }
});






router.get('/todos-servicos', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    // Buscar todos os serviços ativos para o salão do usuário
    const servicos = await Servico.findAll({
      where: { SalaoId: usuario.SalaoId, ativo: true },
      attributes: ['id', 'nome', 'descricao', 'preco', 'ativo'],
      raw: true,
    });

    res.json(servicos);  // Retorna apenas os serviços, sem agrupamento
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar serviços' });
  }
});









module.exports = router;
