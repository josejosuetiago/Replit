# Usa Node.js 18
FROM node:18

# Cria diretório da aplicação
WORKDIR /app

# Copia arquivos
COPY package.json .
COPY server.js .

# Instala dependências
RUN npm install

# Expõe porta padrão
EXPOSE 8080

# Inicia o app
CMD ["node", "server.js"]
