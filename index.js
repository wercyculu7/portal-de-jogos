const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rota principal para exibir os quizzes
app.get('/jogar/:slug', async (req, res) => {
    const slug = req.params.slug;
    console.log(`Recebida requisição para o quiz: ${slug}`);

    try {
        // 1. Pergunta ao banco de dados qual é a URL do Canva para este slug
        const queryResult = await pool.query(
            'SELECT url_canva FROM quizzes WHERE slug = $1', 
            [slug]
        );

        if (queryResult.rowCount === 0) {
            console.log(`Quiz com slug "${slug}" não encontrado no banco de dados.`);
            return res.status(404).send('<h1>Jogo não encontrado</h1><p>O jogo que você está tentando acessar não existe ou foi removido.</p>');
        }

        const targetUrl = queryResult.rows[0].url_canva;
        console.log(`URL do Canva encontrada: ${targetUrl}`);

        // 2. O servidor "visita" o site do Canva para pegar o conteúdo
        const response = await axios.get(targetUrl, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

        
        // 3. O servidor entrega o conteúdo para o usuário, mascarando a URL
        res.send(response.data);

    } catch (error) {
        console.error(`Erro ao processar o quiz "${slug}":`, error.message);
        res.status(500).send('<h1>Erro ao carregar</h1><p>Ocorreu um erro inesperado ao tentar carregar o jogo. Tente novamente mais tarde.</p>');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Serviço Portal de Jogos rodando na porta ${port}`);
});
