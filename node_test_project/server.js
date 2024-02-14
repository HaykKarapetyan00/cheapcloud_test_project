const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    const { method, url } = req;

    if (url === '/' && method === 'GET') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (url === '/upload' && method === 'POST') {
        const filePath = path.join(__dirname, 'uploads', `${Date.now()}`);
        const writeStream = fs.createWriteStream(filePath);

        req.pipe(writeStream);

        writeStream.on('error', (err) => {
            console.error('Error writing file:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        });

        writeStream.on('finish', () => {
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end(path.basename(filePath));
        });
    } else if (url.startsWith('/files/') && method === 'GET') {
        const fileId = url.substring(7);
        const filePath = path.join(__dirname, 'uploads', fileId);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${fileId}"`
                });
                fs.createReadStream(filePath).pipe(res);
            }
        });
    } else if (url.startsWith('/files/') && method === 'DELETE') {
        const fileId = url.substring(7);
        const filePath = path.join(__dirname, 'uploads', fileId);

        fs.unlink(filePath, (err) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('File deleted successfully');
            }
        });
    } else if (url === '/files' && method === 'GET') {
        fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(files));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
