export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const { repo, branch, commitMsg, fileName, fileBase64 } = req.body;

        // Recupera o token da variável de ambiente configurada na Vercel
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return res.status(500).json({ 
                message: 'A variável de ambiente GITHUB_TOKEN não está configurada na Vercel.' 
            });
        }

        if (!repo || !fileName || !fileBase64) {
            return res.status(400).json({ 
                message: 'Dados insuficientes. Forneça o repositório, nome do arquivo e conteúdo.' 
            });
        }

        const targetBranch = branch || 'main';
        const message = commitMsg || `Upload ${fileName} via Vercel`;
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(fileName)}`;

        // Verificar se o arquivo já existe no GitHub para obter o SHA
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
            // Se o arquivo não existir ainda, prossegue sem SHA
        }

        const bodyData = {
            message: message,
            content: fileBase64,
            branch: targetBranch
        };
        if (sha) {
            bodyData.sha = sha;
        }

        // Fazer commit/upload para o GitHub
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
                message: 'Arquivo enviado com sucesso!'
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
