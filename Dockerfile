# Usa Node.js oficial
FROM node:20-alpine

# Cria diretório
WORKDIR /app

# Copia os arquivos
COPY package.json ./
RUN npm install

COPY api ./api

# Porta padrão do container
EXPOSE 8080

# Comando de inicialização
CMD ["npm", "start"]
