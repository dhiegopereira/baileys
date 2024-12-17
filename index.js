import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import express from 'express';

const app = express();
app.use(express.json());

let sock;
let lastConnectionCheck = Date.now();
let contacts = []; 
let messageQueue = [];
let retryCount = 0;
const maxRetries = 5;
let groupIds = [];

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            keepAliveIntervalMs: 30000
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Conexão encerrada devido a', lastDisconnect?.error, ', reconectar:', shouldReconnect);
                if (shouldReconnect && retryCount < maxRetries) {
                    retryCount++;
                    connectToWhatsApp().catch(console.error);
                } else {
                    console.log('Número máximo de tentativas de reconexão atingido.');
                }
            } else if (connection === 'open') {
                console.log('Conexão aberta com sucesso 🎉');
                retryCount = 0;
                processMessageQueue().catch(console.error);
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const message = m.messages[0];

                if (!message.key.fromMe && message.message?.conversation) {
                    console.log('Mensagem recebida:', message.message.conversation);
                    console.log('Nome do remetente:', message.pushName);

                    const contactExists = contacts.some(contact => contact.id === message.key.remoteJid);
                    if (!contactExists) {
                        contacts.push({
                            id: message.key.remoteJid,
                            name: message.pushName,
                            message: message.message.conversation
                        });
                    } else {
                        contacts = contacts.map(contact => 
                            contact.id === message.key.remoteJid 
                            ? { ...contact, message: message.message.conversation } 
                            : contact
                        );
                    }

                    const remoteJid = message.key.remoteJid;
                    if (remoteJid) {
                        await sock.sendMessage(remoteJid, { text: 'Olá, como posso ajudar?' });
                    }
                }
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
            }
        });
    } catch (error) {
        console.error('Erro ao conectar ao WhatsApp:', error);
    }
}

async function sendMessageWithRetry(to, message) {
    try {
        await sock.sendMessage(to, { text: message });
        console.log('Mensagem enviada com sucesso');
    } catch (error) {
        console.error('Erro ao enviar mensagem, adicionando à fila:', error);
        messageQueue.push({ to, message });
    }
}

async function processMessageQueue() {
    while (messageQueue.length > 0) {
        const { to, message } = messageQueue.shift();
        try {
            await sock.sendMessage(to, { text: message });
            console.log('Mensagem da fila enviada com sucesso');
        } catch (error) {
            console.error('Erro ao enviar mensagem da fila, re-adicionando à fila:', error);
            messageQueue.push({ to, message });
            break;
        }
    }
}

app.post('/send-message', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).send('Número do destinatário e mensagem são obrigatórios');
    }

    try {
        await sendMessageWithRetry(`${to}@s.whatsapp.net`, message);
        res.send('Mensagem enviada com sucesso');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send('Erro ao enviar mensagem');
    }
});

app.get('/connect', (req, res) => {
    if (sock?.user) {
        res.send('WhatsApp está conectado');
    } else {
        res.send('QR Code necessário para conectar');
    }
});

app.get('/notifications', (req, res) => {
    res.json(contacts);
});

app.post('/send', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).send('Número do destinatário e mensagem são obrigatórios');
    }

    try {
        await sock.sendMessage(`${to}@s.whatsapp.net`, { text: message });
        res.send('Mensagem enviada com sucesso');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send('Erro ao enviar mensagem');
    }
});

app.post('/disconnect', async (req, res) => {
    if (sock) {
        try {
            await sock.logout();
            res.send('Desconectado do WhatsApp');
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            res.status(500).send('Erro ao desconectar');
        }
    } else {
        res.status(400).send('Nenhuma conexão ativa para desconectar');
    }
});

app.get('/groups', async (req, res) => {
    try {
        const groups = await sock.groupFetchAllParticipating();
        groupIds = Object.keys(groups);
        const groupList = groupIds.map(id => ({ id, name: groups[id].subject }));
        res.json(groupList);
    } catch (error) {
        console.error('Erro ao listar grupos:', error);
        res.status(500).send('Erro ao listar grupos');
    }
});

app.post('/send-group', async (req, res) => {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
        return res.status(400).send('ID do grupo e mensagem são obrigatórios');
    }

    if (!groupIds.includes(groupId)) {
        return res.status(400).send('ID do grupo inválido');
    }

    try {
        await sock.sendMessage(groupId, { text: message });
        res.send('Mensagem enviada com sucesso');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send('Erro ao enviar mensagem');
    }
});

async function startServer() {
    await connectToWhatsApp();

    app.listen(3007, () => {
        console.log('Servidor Express rodando na porta 3000');
    });
}

startServer();
