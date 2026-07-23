import { put } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const filename = req.query.filename || `upload-${Date.now()}`;

        // Envia o stream do arquivo para o Vercel Blob Storage
        const blob = await put(filename, req, {
            access: 'public',
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
