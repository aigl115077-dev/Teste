import { put } from '@vercel/blob';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    try {
        const filename = req.query.filename || `avatar-${Date.now()}`;
        const token = process.env.BLOB_READ_WRITE_TOKEN;

        const blob = await put(filename, req, {
            access: 'public',
            token: token || undefined,
        });

        return res.status(200).json(blob);
    } catch (error) {
        return res.status(500).json({ 
            error: error.message || 'Erro ao realizar upload no Vercel Blob.' 
        });
    }
}
