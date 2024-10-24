const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const cors = require('cors');
const basicAuth = require('basic-auth');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const session = require('express-session');


// Configurando o multer para upload
const upload = multer({ dest: 'uploads/' });
require('dotenv').config(); // Adicione esta linha para carregar variáveis de ambiente

const app = express();

app.use(express.json());
app.use(cors());

// Configura o diretório público para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let transporter = nodemailer.createTransport({
  host: 'mail.mailrouter.net',
  port: '25',
  secure: false,
  tls: {
    rejectUnauthorized: false
  },
});

let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  // Tabela de participantes
  db.run(`CREATE TABLE IF NOT EXISTS Participante (
    matricula INTEGER PRIMARY KEY,
    aiu TEXT,
    nome_completo TEXT,
    email TEXT
  )`);

  // Tabela de participantes excepcionais
  db.run(`CREATE TABLE IF NOT EXISTS Excepcionais (
    matricula INTEGER PRIMARY KEY, 
    nome_completo TEXT,
    departamento TEXT email TEXT
  )`);

  // Tabela de itens
  db.run(`CREATE TABLE IF NOT EXISTS Itens (
    patrimonio INTEGER PRIMARY KEY,
    modelo TEXT,
    descricao TEXT,
    valor REAL,
    categoria TEXT,
    disponivel INTEGER DEFAULT 1,
    ganhador INTEGER,
    FOREIGN KEY(ganhador) REFERENCES Participante(matricula)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Inscricao (
    id_inscricao INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_inscricao TEXT,
    participante INTEGER,
    item INTEGER,
    aiu_inscricao TEXT,
    ganhou INTEGER DEFAULT 0,
    data_sorteio TEXT,       
    horario_sorteio TEXT,
    FOREIGN KEY(aiu_inscricao) REFERENCES Participante(aiu),
    FOREIGN KEY(nome_inscricao) REFERENCES Participante(nome_completo),
    FOREIGN KEY(participante) REFERENCES Participante(matricula),
    FOREIGN KEY(item) REFERENCES Itens(patrimonio)
  )`);
});


app.get('/status', (req, res) => {
  const status = { 'Status': 'Running' };
  res.send(status);
});

app.post('/insert/:table', (req, res) => {
  let table = req.params.table;
  let data = req.body;
  let keys = Object.keys(data).join(',');
  let placeholders = Object.keys(data).map(() => '?').join(',');
  let values = Object.values(data);
  let sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;

  db.run(sql, values, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ lastID: this.lastID });
  });
});

app.put('/update/:table/:id', (req, res) => {
  let table = req.params.table;
  let id = req.params.id;
  let data = req.body;
  let updates = Object.keys(data).map(key => `${key} = ?`).join(',');
  let values = Object.values(data).concat(id);
  let sql = `UPDATE ${table} SET ${updates} WHERE rowid = ?`;

  db.run(sql, values, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

app.get('/delete/:table/:id', (req, res) => {
  let table = req.params.table;
  let id = req.params.id;
  let sql = `DELETE FROM ${table} WHERE rowid = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

app.get('/select/:table/:id', (req, res) => {
  let table = req.params.table;
  let id = req.params.id;
  let sql = `SELECT * FROM ${table} WHERE rowid = ?`;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(row);
  });
});

app.get('/select/:table', (req, res) => {
  let table = req.params.table;

  // Se a tabela for "itens", filtrar apenas os disponíveis
  let sql;
  if (table === 'itens') {
    sql = `SELECT * FROM ${table} WHERE disponivel = 1`;
  } else {
    sql = `SELECT * FROM ${table}`;
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/itens', (req, res) => {
  const sql = 'SELECT * FROM Itens';

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows); // Retorna todos os itens como JSON
  });
});

app.get('/inscricao/:id', (req, res) => {
  let id = req.params.id;
  let sql = `SELECT Participante.nome_completo, Itens.modelo
             FROM Inscricao
             JOIN Participante ON Participante.matricula = Inscricao.participante
             JOIN Itens ON Itens.patrimonio = Inscricao.item
             WHERE Inscricao.id_inscricao = ?`;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(row);
  });
});

// Rota para buscar todos os ganhadores do banco de dados
app.get('/ganhadores', (req, res) => {
  const sql = `
    SELECT I.nome_inscricao, I.participante, I.aiu_inscricao, I.item, 
           It.modelo, It.categoria, I.data_sorteio, I.horario_sorteio
    FROM Inscricao AS I
    JOIN Itens AS It ON I.item = It.patrimonio
    WHERE I.ganhou = 1
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/drop/:table', (req, res) => {
  const table = req.params.table;
  const sql = `DROP TABLE IF EXISTS ${table}`;
  db.run(sql, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: `Tabela ${table} apagada com sucesso!` });
  });
});

app.get('/sorteio/:patrimonio', (req, res) => {
  let patrimonio = req.params.patrimonio;
  processSorteio(patrimonio, res);
});


function processSorteio(patrimonio, res) {
  // Seleciona apenas funcionários excepcionais
  const selectSql = `SELECT id_inscricao, participante 
                     FROM Inscricao 
                     WHERE item = ? 
                     AND id_inscricao NOT IN (SELECT id_inscricao FROM Inscricao WHERE ganhou = 1)
                     AND participante IN (SELECT matricula FROM Excepcionais)`;

  db.all(selectSql, [patrimonio], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Se não houver funcionários excepcionais disponíveis, retorna uma mensagem
    if (rows.length === 0) {
      return res.status(200).json({ 
        message: 'Todos os funcionários excepcionais já foram sorteados.',
      });
    }

    // Continua o processo de sorteio
    let vencedor = rows[Math.floor(Math.random() * rows.length)];
    
    // Armazena a data e a hora do sorteio
    const dataSorteio = new Date().toLocaleDateString(); // Formata a data
    const horarioSorteio = new Date().toLocaleTimeString(); // Formata a hora

    // Atualiza o status de quem ganhou e armazena a data e horário do sorteio
    const updateInscricaoSql = `UPDATE Inscricao 
                                SET ganhou = 1, data_sorteio = ?, horario_sorteio = ? 
                                WHERE id_inscricao = ?`;
    db.run(updateInscricaoSql, [dataSorteio, horarioSorteio, vencedor.id_inscricao], function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const getParticipanteSql = `SELECT nome_completo FROM Participante WHERE matricula = ?`;
      db.get(getParticipanteSql, [vencedor.participante], function (err, participante) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        const updateItemSql = `UPDATE Itens SET disponivel = 0, ganhador = ? WHERE patrimonio = ?`;
        db.run(updateItemSql, [participante.nome_completo, patrimonio], function (err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }

          const deleteAllSql = `DELETE FROM Inscricao WHERE item = ? AND participante != ?`;
          db.run(deleteAllSql, [patrimonio, vencedor.participante], function (err) {
            if (err) {
              return res.status(400).json({ error: err.message });
            }

            const deleteWinnerSql = `DELETE FROM Inscricao WHERE participante = ? AND id_inscricao != ?`;
            db.run(deleteWinnerSql, [vencedor.participante, vencedor.id_inscricao], function (err) {
              if (err) {
                return res.status(400).json({ error: err.message });
              }

              // Aqui você pode enviar um e-mail para o vencedor ou continuar o processo
              sendWinnerEmail(vencedor.id_inscricao, res);
            });
          });
        });
      });
    });
  });
}


function sendWinnerEmail(inscricaoId, res) {
  let emailSql = `SELECT Participante.nome_completo, Participante.email, Participante.aiu, Itens.modelo, Itens.valor, Itens.patrimonio, Itens.descricao
                  FROM Participante 
                  JOIN Inscricao ON Participante.matricula = Inscricao.participante 
                  JOIN Itens ON Itens.patrimonio = Inscricao.item 
                  WHERE Inscricao.id_inscricao = ?`;

  db.get(emailSql, [inscricaoId], (err, result) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Usa o valor de aiu diretamente
    let aiu = result.aiu;

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${aiu}@amway.com`, // Usa a variável aiu
      subject: 'Parabéns! Você ganhou no sorteio!',
      text: `Olá ${result.nome_completo},\n\nParabéns! Você ganhou o item:\n\n` +
            `| **Modelo**      | ${result.modelo}        |\n` +
            `| **Descrição**   | ${result.descricao}     |\n` +
            `| **Valor**       | R$${result.valor}       |\n` +
            `| **Patrimônio**  | ${result.patrimonio}    |\n\n` +
            `Obrigado por participar!\n\nContate a TI em Breve.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: 'Erro ao enviar e-mail.' });
      }

      console.log('E-mail enviado: ' + info.response);
      return res.json({ message: 'Sorteio realizado com sucesso!', vencedor: result.nome_completo });
    });
  });
}

app.post('/cadastro-item', (req, res) => {
  const { patrimonio, modelo, descricao, valor, categoria } = req.body;

  if (!patrimonio || !modelo || !descricao || !valor || !categoria) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const selectSql = `SELECT * FROM Itens WHERE patrimonio = ?`;
  db.get(selectSql, [patrimonio], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      return res.status(400).json({ error: 'Patrimônio já cadastrado.' });
    }

    const insertSql = `INSERT INTO Itens (patrimonio, modelo, descricao, valor, categoria) VALUES (?, ?, ?, ?, ?)`;
    db.run(insertSql, [patrimonio, modelo, descricao, valor, categoria], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: 'Item cadastrado com sucesso!', itemId: this.lastID });
    });
  });
});

function ensureDirectoryExistence(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Rota para Criar um Arquivo XLSX com Todas as Tabelas
app.get('/export/all-tables', async (req, res) => {
  try {
    const filePath = './exports/all-tables.xlsx';
    ensureDirectoryExistence(filePath);

    const workbook = new ExcelJS.Workbook();

    // Exportar Participante
    const participanteSheet = workbook.addWorksheet('Participante');
    const participantes = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Participante', (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
    participanteSheet.addRow(['matricula', 'aiu', 'nome_completo', 'email']);
    participantes.forEach(p => participanteSheet.addRow([p.matricula, p.aiu, p.nome_completo, p.email]));

    // Exportar Itens
    const itensSheet = workbook.addWorksheet('Itens');
    const itens = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Itens', (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
    itensSheet.addRow(['patrimonio', 'modelo', 'descricao', 'valor', 'categoria']);
    itens.forEach(i => itensSheet.addRow([i.patrimonio, i.modelo, i.descricao, i.valor, i.categoria]));

    // Exportar Inscricao
    const inscricaoSheet = workbook.addWorksheet('Inscricao');
    const inscricoes = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Inscricao', (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
    inscricaoSheet.addRow(['id_inscricao', 'nome_inscricao', 'participante', 'item', 'aiu_inscricao', 'ganhou']);
    inscricoes.forEach(i => inscricaoSheet.addRow([i.id_inscricao, i.nome_inscricao, i.participante, i.item, i.aiu_inscricao, i.ganhou]));

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar o arquivo.' });
  }
});

app.post('/send-email', async (req, res) => {
  const { nome_completo, email, matricula, itensEscolhidos} = req.body; // Usa matricula ao invés de participante_id

  try {
    // Consulta para buscar todos os itens que o participante se inscreveu usando matricula
    const inscricaoSql = `SELECT I.modelo, I.descricao, I.patrimonio FROM Inscricao AS Ins 
                          JOIN Itens AS I ON Ins.item = I.patrimonio 
                          WHERE Ins.participante = ?`;
    
    // Executa a consulta e obtém os resultados
    const rows = await new Promise((resolve, reject) => {
      db.all(inscricaoSql, [matricula], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    // Verifica se o participante se inscreveu em algum item
    let itensInscritos;
    if (rows.length === 0) {
      itensInscritos = '<tr><td colspan="2">Você ainda não se inscreveu em nenhum item.</td></tr>';
    } else {
      itensInscritos = rows.map(row => `
        <tr>
          <td>${row.modelo}</td>
          <td>${row.descricao}</td>
          <td>${row.patrimonio}</td>
        </tr>
      `).join('');
    }

    // Configura o conteúdo do e-mail com uma tabela HTML
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${email}@amway.com`,  // E-mail do participante
      subject: 'Confirmação de Cadastro',
      html: `
        <h1>Olá ${nome_completo},</h1>
        <p>Seu cadastro no "Faça bom uso do usado" foi confirmado com sucesso!</p>
        <h2>Você se inscreveu nos seguintes itens:</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Descrição</th>
              <th>Patrimonio</th>
            </tr>
          </thead>
          <tbody>
            ${itensInscritos}
          </tbody>
        </table>
        <p>Obrigado!</p>
      `,
    };

    // Envia o e-mail
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso.');
    res.status(200).send('E-mail de confirmação enviado com sucesso.');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para fazer upload do Excel e processar
app.post('/upload/excel', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
  }

  // Caminho do arquivo enviado
  const filePath = file.path;

  // Processa o arquivo Excel usando ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.xlsx.readFile(filePath)
    .then(() => {
      const worksheet = workbook.getWorksheet(1);  // Pega a primeira aba da planilha
      const itens = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {  // Supondo que a primeira linha seja o cabeçalho
          const patrimonio = row.getCell(1).value;  // Coluna 1: Patrimônio
          const modelo = row.getCell(2).value;      // Coluna 2: Modelo
          const descricao = row.getCell(3).value;   // Coluna 3: Descrição
          const valor = row.getCell(4).value;       // Coluna 4: Valor
          const categoria = row.getCell(5).value;   // Coluna 5: categoria

          // Adiciona o item à lista
          itens.push({ patrimonio, modelo, descricao, valor, categoria });
        }
      });

      // Insere os itens no banco de dados
      const insertPromises = itens.map(item => {
        const sql = `INSERT INTO Itens (patrimonio, modelo, descricao, valor,categoria , disponivel) VALUES (?, ?, ?, ?, ?, 1)`;
        return new Promise((resolve, reject) => {
          db.run(sql, [item.patrimonio, item.modelo, item.descricao, item.valor, item.categoria], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });

      // Espera a inserção de todos os itens
      Promise.all(insertPromises)
        .then(() => {
          res.status(200).json({ message: 'Itens inseridos com sucesso!' });
        })
        .catch(error => {
          res.status(500).json({ error: error.message });
        });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    })
    .finally(() => {
      // Remove o arquivo após processá-lo
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Erro ao deletar o arquivo:', err);
        }
      });
    });
});
// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use path.join para criar um caminho correto
    cb(null, path.join(__dirname, 'public', 'foto_itens')); // Diretório onde as imagens serão salvas
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Mantém o nome original do arquivo
  },
});
// Exportar o middleware para uso em rotas, se necessário
module.exports = upload;

const uploadimg = multer({ storage: storage });

// Rota para upload da imagem
app.post('/upload', uploadimg.single('imageFile'), (req, res) => { // O nome 'imageFile' deve corresponder ao campo do formulário
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }
  res.send('Imagem enviada com sucesso!');
});


app.get('/export/ganhadores', async (req, res) => {
  try {
    const filePath = './exports/ganhadores.xlsx';
    ensureDirectoryExistence(filePath);

    const workbook = new ExcelJS.Workbook();

    // Exportar Inscrições com ganhou = 1
    const ganhadoresSheet = workbook.addWorksheet('Ganhadores');

    // Modifique a consulta para usar um alias diferente
    const ganhadores = await new Promise((resolve, reject) => {
      db.all(`
        SELECT I.modelo, I.categoria, P.nome_completo, P.matricula, I.patrimonio 
        FROM Inscricao AS inscricao
        JOIN Participante AS P ON inscricao.participante = P.matricula
        JOIN Itens AS I ON inscricao.item = I.patrimonio
        WHERE inscricao.ganhou = 1
      `, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Verificar se há ganhadores
    if (ganhadores.length === 0) {
      return res.status(404).json({ message: 'Nenhum ganhador encontrado.' });
    }

    // Adicionar cabeçalhos
    ganhadoresSheet.addRow(['nome_inscricao', 'matricula', 'item', 'modelo', 'categoria', ]);
    
    // Adicionar dados à planilha
    ganhadores.forEach(g => 
      ganhadoresSheet.addRow([g.nome_completo, g.matricula, g.patrimonio, g.modelo, g.categoria,])
    );

    // Salvar o arquivo XLSX
    await workbook.xlsx.writeFile(filePath);

    // Enviar o arquivo gerado para download
    res.download(filePath);
  } catch (error) {
    console.error(error); // Log do erro para diagnóstico
    res.status(500).json({ error: 'Erro ao gerar o arquivo.' });
  }
});


app.get('/export/inscritos/:itemId', async (req, res) => {
  const itemId = req.params.itemId;

  try {
    const filePath = `./exports/inscritos_item_${itemId}.xlsx`;
    ensureDirectoryExistence(filePath);

    const workbook = new ExcelJS.Workbook();

    // Exportar todos os inscritos para o item específico
    const inscritosSheet = workbook.addWorksheet('Inscritos');
    const inscritos = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Inscricao WHERE item = ?', [itemId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Adicionar cabeçalhos
    inscritosSheet.addRow(['id_inscricao', 'nome_inscricao', 'participante', 'item', 'aiu_inscricao', 'ganhou']);

    // Adicionar dados à planilha
    inscritos.forEach(i => 
      inscritosSheet.addRow([i.id_inscricao, i.nome_inscricao, i.participante, i.item, i.aiu_inscricao, i.ganhou])
    );

    // Salvar o arquivo XLSX
    await workbook.xlsx.writeFile(filePath);

    // Enviar o arquivo gerado para download
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar o arquivo.' });
  }
});
app.get('/export/all-inscricoes', async (req, res) => {
  try {
    const filePath = './exports/all-inscricoes.xlsx';
    ensureDirectoryExistence(filePath);

    const workbook = new ExcelJS.Workbook();

    // Buscando todos os itens
    const itens = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Itens', (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Para cada item, cria uma aba e adiciona as inscrições
    for (const item of itens) {
      const inscricaoSheet = workbook.addWorksheet(`Inscrições - ${item.patrimonio}`);

      // Adicionando cabeçalho
      inscricaoSheet.addRow(['id_inscricao', 'nome_inscricao', 'participante', 'aiu_inscricao', 'ganhou']);

      // Buscando inscrições para o item atual
      const inscricoes = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM Inscricao WHERE item = ?', [item.patrimonio], (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });

      // Adicionando as inscrições à aba do item
      inscricoes.forEach(i => inscricaoSheet.addRow([i.id_inscricao, i.nome_inscricao, i.participante, i.aiu_inscricao, i.ganhou]));
    }

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar o arquivo.' });
  }
});

// Rota para verificar se a matrícula está cadastrada
app.get('/check-matricula', (req, res) => {
  const matricula = req.query.matricula; // Obtém a matrícula da query string

  // Verifica se a matrícula foi fornecida
  if (!matricula) {
      return res.status(400).json({ error: 'Matrícula não fornecida.' });
  }

  // Consulta ao banco de dados
  db.get(`SELECT COUNT(*) AS count FROM Participante WHERE matricula = ?`, [matricula], (err, row) => {
      if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Erro ao acessar o banco de dados.' });
      }

      // Verifica se a matrícula já está cadastrada
      if (row.count > 0) {
          return res.json({ cadastrada: true }); // Matrícula já cadastrada
      } else {
          return res.json({ cadastrada: false }); // Matrícula não cadastrada
      }
  });
});

require('dotenv').config(); // Carrega as variáveis de ambiente

// Middleware para processar dados do formulário
app.use(express.urlencoded({ extended: true })); // Para dados urlencoded
app.use(express.json()); // Para dados JSON

// Configuração da sessão usando variável de ambiente
app.use(session({
    secret: process.env.SESSION_SECRET, // Usar variável de ambiente
    resave: false,
    saveUninitialized: true,
}));

const users = [
    { username: 'admin', password: process.env.ADMIN_PASSWORD, isAdmin: true },
    { username: 'user', password: process.env.USER_PASSWORD, isAdmin: false },
];

// Middleware para verificar se o usuário é administrador
function checkAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    } else {
        return res.status(403).send('Acesso negado. Você não é um administrador.');
    }
}

// Rota para a página de login
app.get('/login', (req, res) => {
    res.send(`
        <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Usuário" required>
            <input type="password" name="password" placeholder="Senha" required>
            <button type="submit">Entrar</button>
        </form>
    `);
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        req.session.user = { username: user.username, isAdmin: user.isAdmin };
        return res.redirect('/admin'); // Redireciona para a página admin após login
    }
    res.send('Usuário ou senha inválidos.');
});

// Rota para a página de administração
app.get('/admin', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});
// Rota para cadastro de PCs
app.get('/cadastroPC.html', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cadastroPC.html'));
});
// Rota para lista de ganhadores
app.get('/ganhadores.html', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'ganhadores.html'));
});



// Rota para upload de arquivos Excel
app.post('/upload-excepcionais', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(req.file.path);
  const worksheet = workbook.worksheets[0];

  const queries = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Ignora a primeira linha (cabeçalho)
      const matricula = row.getCell(1).value;
      const nomeCompleto = row.getCell(2).value;
      const departamento = row.getCell(3).value;

      const query = `INSERT INTO Excepcionais (matricula, nome_completo, departamento) VALUES (?, ?, ?)`;
      queries.push(new Promise((resolve, reject) => {
        db.run(query, [matricula, nomeCompleto, departamento], (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      }));
    }
  });

  try {
    await Promise.all(queries);
    res.send('Dados importados com sucesso!');
  } catch (error) {
    res.status(500).send('Erro ao importar os dados: ' + error.message);
  }
});


// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
