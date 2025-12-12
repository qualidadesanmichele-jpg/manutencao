HospitalSys - Render-ready package
=================================

Conteúdo:
- frontend/index.html  (frontend atualizado para https://hospitalsys.onrender.com)
- backend/server.js     (Express + Socket.io)
- backend/package.json
- backend/render.yaml
- backend/.env.example

Como subir no Render (passo-a-passo rápido):
1. Crie conta em https://render.com (gratuito)
2. Faça upload do repositório ZIP ou conecte ao GitHub (recomendado)
3. Se for upload ZIP: escolha "New -> Web Service" e faça upload, ou siga instruções do Render para ZIP deployment.
4. Se usar GitHub: crie novo repo, envie os arquivos, e no Render escolha "Connect a new repo" -> selecione repo -> Deploy
5. Após Deploy, o serviço estará disponível em: https://hospitalsys.onrender.com (se disponível)

Observações:
- Dados são mantidos em memória (reinício apaga chamados). Para produção, substitua por DB (Postgres, MySQL, Mongo).
- Render free dorme após inatividade; ao acessar o site, pode demorar alguns segundos para acordar.
- Socket.io/WebSockets funcionam no Render.

