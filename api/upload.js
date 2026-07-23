import { put } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const filename = req.query.filename || `upload-${Date.now()}`;
        
        // Procura dinamicamente o token caso a Vercel tenha usado um prefixo (ex: testeblob_READ_WRITE_TOKEN)
        const tokenKey = Object.keys(process.env).find(k => k.endsWith('_READ_WRITE_TOKEN')) || 'BLOB_READ_WRITE_TOKEN';
        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env[tokenKey];

        if (!token) {
            return res.status(500).json({ 
                message: 'A variável de token do Vercel Blob não foi encontrada nas configurações do projeto.' 
            });
        }

        // Envia o stream do arquivo para o Vercel Blob Storage
        const blob = await put(filename, req, {
            access: 'public',
            token: token,
        });

        return res.status(200).json({
            success: true,
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            pathname: blob.pathname,
            message: 'Arquivo enviado com sucesso para o Vercel Blob!'
        });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message || 'Erro ao salvar no Vercel Blob. Verifique se o Vercel Blob está habilitado nas configurações do projeto.' 
        });
    }
}
