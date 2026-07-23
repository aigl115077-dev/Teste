export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { branch, commitMsg, fileName, fileBase64 } = req.body;

        // Recupera as variáveis de ambiente configuradas na Vercel
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO || req.body.repo;

        if (!token) {
            return res.status(500).json({ 
                message: 'A variável de ambiente GITHUB_TOKEN não está configurada na Vercel.' 
            });
        }

        if (!repo) {
            return res.status(500).json({ 
                message: 'A variável de ambiente GITHUB_REPO (ex: usuario/repositorio) não está configurada na Vercel.' 
            });
        }

        if (!fileName || !fileBase64) {
            return res.status(400).json({ 
                message: 'Nenhum arquivo fornecido.' 
            });
        }

        const targetBranch = branch || 'main';
        const message = commitMsg || `Upload ${fileName} para a raiz via Web Interface`;
        
        // Salva diretamente na raiz do repositório (ex: /nome-do-arquivo.ext)
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(fileName)}`;

        // Verificar se o arquivo já existe no GitHub para obter o SHA (necessário para atualizar caso já exista)
        let sha = null;
        try {
            const checkRes = await fetch(`${apiUrl}?ref=${targetBranch}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Vercel-Git-Uploader'
                }
            });
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                sha = checkData.sha;
            }
        } catch (e) {
            // Se o arquivo for novo, prossegue sem SHA
        }

        const bodyData = {
            message: message,
            content: fileBase64,
            branch: targetBranch
        };
        if (sha) {
            bodyData.sha = sha;
        }

        // Fazer commit/upload para o GitHub na raiz
        const uploadRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Vercel-Git-Uploader'
            },
            body: JSON.stringify(bodyData)
        });

        const resData = await uploadRes.json();

        if (uploadRes.ok) {
            return res.status(200).json({
                success: true,
                url: resData.content?.html_url || `https://github.com/${repo}`,
                message: 'Arquivo enviado com sucesso para a raiz do repositório!'
            });
        } else {
            return res.status(uploadRes.status).json({
                message: resData.message || 'Erro ao enviar para a API do GitHub.'
            });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Erro interno do servidor.' });
    }
}
